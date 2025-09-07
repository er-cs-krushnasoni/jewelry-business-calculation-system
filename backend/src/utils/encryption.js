const crypto = require('crypto');

class PasswordEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16;  // 128 bits
  }

  // Generate a random encryption key for a shop
  generateShopMasterKey() {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  // Encrypt password using shop's master key
  encryptPassword(password, shopMasterKey) {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const key = Buffer.from(shopMasterKey, 'hex');
      
      // Use createCipheriv for GCM mode - compatible with all Node.js versions
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      
      let encrypted = cipher.update(password, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Return iv + authTag + encrypted data as single string
      return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    } catch (error) {
      throw new Error('Password encryption failed: ' + error.message);
    }
  }

  // Decrypt password using shop's master key
  decryptPassword(encryptedData, shopMasterKey) {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      const key = Buffer.from(shopMasterKey, 'hex');

      // Use createDecipheriv for GCM mode - compatible with all Node.js versions
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      
      // Set auth tag for GCM mode
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error('Password decryption failed: ' + error.message);
    }
  }

  // Verify encrypted password matches plain text (for login)
  async verifyEncryptedPassword(plainPassword, encryptedData, shopMasterKey) {
    try {
      const decryptedPassword = this.decryptPassword(encryptedData, shopMasterKey);
      return plainPassword === decryptedPassword;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new PasswordEncryption();