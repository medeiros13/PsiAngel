using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Security.Cryptography;
using System.Text;

namespace Backend.Helpers
{
    public class EncryptedStringConverter : ValueConverter<string?, string?>
    {
        public EncryptedStringConverter(string encryptionKey, ConverterMappingHints? mappingHints = null) : base
            (
            v => Encrypt(v, encryptionKey),
            v => Decrypt(v, encryptionKey),
            mappingHints)
        { }

        private static string? Encrypt(string? plainText, string keyString)
        {
            if (string.IsNullOrEmpty(plainText)) return plainText;

            byte[] key = Encoding.UTF8.GetBytes(keyString.PadRight(32).Substring(0, 32));
            using var aes = Aes.Create();
            aes.Key = key;
            aes.GenerateIV();
            var iv = aes.IV;

            using var encryptor = aes.CreateEncryptor(aes.Key, iv);
            using var ms = new MemoryStream();
            ms.Write(iv, 0, iv.Length);

            using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
            using (var sw = new StreamWriter(cs))
            {
                sw.Write(plainText);
            }

            return Convert.ToBase64String(ms.ToArray());
        }

        private static string? Decrypt(string? cipherText, string keyString)
        {
            if (string.IsNullOrEmpty(cipherText)) return cipherText;

            byte[] fullCipher = Convert.FromBase64String(cipherText);
            byte[] key = Encoding.UTF8.GetBytes(keyString.PadRight(32).Substring(0, 32));

            using var aes = Aes.Create();
            aes.Key = key;

            byte[] iv = new byte[16];
            Array.Copy(fullCipher, 0, iv, 0, iv.Length);
            aes.IV = iv;

            using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
            using var ms = new MemoryStream(fullCipher, iv.Length, fullCipher.Length - iv.Length);
            using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
            using var sr = new StreamReader(cs);
            
            return sr.ReadToEnd();
        }
    }
}
