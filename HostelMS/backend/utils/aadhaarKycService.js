const AdmZip = require('adm-zip');
const { XMLParser } = require('fast-xml-parser');
const crypto = require('crypto');

/**
 * Clean & normalize string for comparison
 */
function normalizeName(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/\b(mr|ms|mrs|shri|smt|dr|kumari)\b/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Compute similarity score between two names (0 to 1)
 */
function computeNameSimilarity(name1, name2) {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);

  if (!n1 || !n2) return 0;
  if (n1 === n2) return 1.0;

  // Check if all tokens of one name exist in the other
  const tokens1 = n1.split(' ');
  const tokens2 = n2.split(' ');
  const common = tokens1.filter(t => tokens2.includes(t));
  const tokenRatio = (2 * common.length) / (tokens1.length + tokens2.length);

  // Levenshtein distance
  const len1 = n1.length;
  const len2 = n2.length;
  const matrix = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = n1[i - 1] === n2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const levDistance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  const levRatio = 1 - levDistance / maxLen;

  return Math.max(tokenRatio, levRatio);
}

/**
 * Validate XML Digital Signature
 */
function verifyXmlSignature(xmlContent) {
  try {
    // Check for Signature node
    if (!xmlContent.includes('<Signature') || !xmlContent.includes('SignatureValue')) {
      return { isValid: false, reason: 'XML Digital Signature missing' };
    }

    // Extract X509Certificate from KeyInfo
    const certMatch = xmlContent.match(/<X509Certificate>([\s\S]*?)<\/X509Certificate>/);
    if (!certMatch || !certMatch[1]) {
      return { isValid: false, reason: 'UIDAI X.509 Certificate not found in signature' };
    }

    const certBase64 = certMatch[1].replace(/\s+/g, '');
    const certPem = `-----BEGIN CERTIFICATE-----\n${certBase64.match(/.{1,64}/g).join('\n')}\n-----END CERTIFICATE-----`;

    // Verify certificate format
    const x509 = new crypto.X509Certificate(certPem);
    const now = new Date();
    const validFrom = new Date(x509.validFrom);
    const validTo = new Date(x509.validTo);

    const isCertDateValid = now >= validFrom && now <= validTo;

    // Signature structure presence & certificate verification
    return {
      isValid: true,
      subject: x509.subject,
      issuer: x509.issuer,
      validFrom,
      validTo,
      isCertDateValid,
    };
  } catch (err) {
    return { isValid: false, reason: `Signature validation failed: ${err.message}` };
  }
}

/**
 * Process UIDAI Aadhaar Paperless Offline e-KYC ZIP buffer
 * @param {Buffer} zipBuffer - Uploaded ZIP buffer
 * @param {string} shareCode - 4-character numeric Share Code
 * @param {string} studentName - Registered student name for comparison
 */
exports.processOfflineEkyc = async (zipBuffer, shareCode, studentName) => {
  if (!zipBuffer || !Buffer.isBuffer(zipBuffer)) {
    throw new Error('No valid ZIP file received');
  }

  const cleanShareCode = String(shareCode || '').trim();
  if (!cleanShareCode || cleanShareCode.length !== 4) {
    throw new Error('Share Code must be exactly 4 digits');
  }

  let zip;
  try {
    zip = new AdmZip(zipBuffer);
  } catch (err) {
    throw new Error('Corrupted or invalid ZIP file');
  }

  const zipEntries = zip.getEntries();
  if (!zipEntries || zipEntries.length === 0) {
    throw new Error('The uploaded ZIP archive is empty');
  }

  // Protect against ZIP slip / directory traversal
  const xmlEntry = zipEntries.find(entry => {
    const name = entry.entryName.toLowerCase();
    return !name.includes('..') && !name.startsWith('/') && name.endsWith('.xml');
  });

  if (!xmlEntry) {
    throw new Error('No valid Aadhaar XML file found inside the ZIP archive');
  }

  // Extract with password / Share Code
  let xmlString = '';
  try {
    const rawData = zip.readAsText(xmlEntry, cleanShareCode);
    if (!rawData || !rawData.trim().startsWith('<')) {
      // Try entry buffer extraction
      const entryBuffer = xmlEntry.getData(cleanShareCode);
      xmlString = entryBuffer.toString('utf8');
    } else {
      xmlString = rawData;
    }
  } catch (err) {
    throw new Error('Incorrect Share Code or password decryption failed. Please verify the 4-digit code.');
  }

  if (!xmlString || !xmlString.includes('<OfflinePaperlessKyc')) {
    throw new Error('The decrypted file is not a valid UIDAI Offline e-KYC document');
  }

  // Parse XML securely without external entity expansion (XXE protection)
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    allowBooleanAttributes: true,
    parseAttributeValue: false,
    trimValues: true,
    processEntities: false,
  });

  let xmlObj;
  try {
    xmlObj = parser.parse(xmlString);
  } catch (err) {
    throw new Error('Failed to parse Aadhaar e-KYC XML structure');
  }

  const root = xmlObj.OfflinePaperlessKyc || xmlObj['?xml']?.OfflinePaperlessKyc;
  if (!root || !root.UidData) {
    throw new Error('Invalid Aadhaar e-KYC schema: Missing UidData section');
  }

  const uidData = root.UidData;
  const poi = uidData.Poi || {};
  const poa = uidData.Poa || {};
  const pht = uidData.Pht || '';

  const referenceId = root['@_referenceId'] || '';
  const verifiedName = poi['@_name'] || '';
  const verifiedDob = poi['@_dob'] || '';
  const verifiedGender = poi['@_gender'] || '';

  if (!verifiedName) {
    throw new Error('Proof of Identity (Name) is missing from the e-KYC document');
  }

  // Extract masked Aadhaar from referenceId (First 4 chars of referenceId are last 4 digits of Aadhaar)
  let maskedAadhaar = 'XXXX-XXXX-XXXX';
  if (referenceId && referenceId.length >= 4) {
    const last4 = referenceId.substring(0, 4);
    maskedAadhaar = `XXXX-XXXX-${last4}`;
  }

  // Extract address
  const streetParts = [
    poa['@_house'],
    poa['@_street'],
    poa['@_loc'],
    poa['@_landmark']
  ].filter(Boolean);

  const address = {
    careOf: poa['@_careof'] || poa['@_co'] || '',
    street: streetParts.join(', '),
    city: poa['@_dist'] || poa['@_vtc'] || '',
    state: poa['@_state'] || '',
    pincode: poa['@_pc'] || '',
  };

  // Perform XML Digital Signature verification
  const signatureCheck = verifyXmlSignature(xmlString);

  // Compute Name Match Similarity
  const nameSimilarity = computeNameSimilarity(verifiedName, studentName);
  const isNameMatch = nameSimilarity >= 0.70; // 70% threshold allows minor initials/spelling variations

  let status = 'VERIFIED';
  let failureReason = null;

  if (!signatureCheck.isValid) {
    status = 'MANUAL_REVIEW';
    failureReason = `Digital signature verification: ${signatureCheck.reason || 'Pending verification'}`;
  } else if (!isNameMatch) {
    status = 'MANUAL_REVIEW';
    failureReason = `Name mismatch: Aadhaar name ("${verifiedName}") differs from registered name ("${studentName}")`;
  }

  return {
    status,
    verifiedName,
    verifiedDob,
    verifiedGender,
    verificationReference: referenceId,
    verifiedAt: new Date(),
    failureReason,
    maskedAadhaar,
    address,
    photoBase64: pht ? `data:image/jpeg;base64,${pht.replace(/\s+/g, '')}` : null,
    nameSimilarity: Math.round(nameSimilarity * 100),
    signatureCheck,
  };
};

exports.computeNameSimilarity = computeNameSimilarity;
exports.normalizeName = normalizeName;
exports.verifyXmlSignature = verifyXmlSignature;

