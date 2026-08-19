using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Backend.Helpers
{
    public class AesGcmValueConverter<T> : ValueConverter<T, string>
    {
        public AesGcmValueConverter(string encryptionKey, ConverterMappingHints? mappingHints = null) 
            : base(
                v => Encrypt(v, encryptionKey),
                v => Decrypt(v, encryptionKey),
                mappingHints)
        { }

        private static string Encrypt(T value, string keyString)
        {
            if (value == null) return null;

            string jsonString = typeof(T) == typeof(string) 
                ? (string)(object)value 
                : JsonSerializer.Serialize(value);

            if (string.IsNullOrEmpty(jsonString)) return null;

            byte[] key = Encoding.UTF8.GetBytes(keyString.PadRight(32).Substring(0, 32));
            
            // AES-GCM requires a 12-byte nonce and generates a 16-byte tag
            byte[] nonce = new byte[12];
            RandomNumberGenerator.Fill(nonce);
            
            byte[] plainBytes = Encoding.UTF8.GetBytes(jsonString);
            byte[] cipherBytes = new byte[plainBytes.Length];
            byte[] tag = new byte[16];

            using (var aesGcm = new AesGcm(key, tag.Length))
            {
                aesGcm.Encrypt(nonce, plainBytes, cipherBytes, tag);
            }

            // Combine nonce + tag + ciphertext
            byte[] result = new byte[nonce.Length + tag.Length + cipherBytes.Length];
            Buffer.BlockCopy(nonce, 0, result, 0, nonce.Length);
            Buffer.BlockCopy(tag, 0, result, nonce.Length, tag.Length);
            Buffer.BlockCopy(cipherBytes, 0, result, nonce.Length + tag.Length, cipherBytes.Length);

            return Convert.ToBase64String(result);
        }

        private static T Decrypt(string cipherTextBase64, string keyString)
        {
            if (string.IsNullOrEmpty(cipherTextBase64)) return default;

            byte[] fullCipher;
            try 
            {
                fullCipher = Convert.FromBase64String(cipherTextBase64);
            }
            catch (FormatException)
            {
                // Fallback for plain text or old data if desired, but in this case it might fail if old data wasn't base64.
                // However, the user agreed to force re-login and lose old tokens, so we'll just throw or return default.
                throw new InvalidOperationException("Dado inválido para descriptografia AES-GCM.");
            }

            if (fullCipher.Length < 28) // 12 (nonce) + 16 (tag)
                throw new InvalidOperationException("Dado muito curto para descriptografia AES-GCM.");

            byte[] key = Encoding.UTF8.GetBytes(keyString.PadRight(32).Substring(0, 32));
            
            byte[] nonce = new byte[12];
            byte[] tag = new byte[16];
            byte[] cipherBytes = new byte[fullCipher.Length - 28];

            Buffer.BlockCopy(fullCipher, 0, nonce, 0, nonce.Length);
            Buffer.BlockCopy(fullCipher, nonce.Length, tag, 0, tag.Length);
            Buffer.BlockCopy(fullCipher, nonce.Length + tag.Length, cipherBytes, 0, cipherBytes.Length);

            byte[] plainBytes = new byte[cipherBytes.Length];

            using (var aesGcm = new AesGcm(key, tag.Length))
            {
                try 
                {
                    aesGcm.Decrypt(nonce, cipherBytes, tag, plainBytes);
                }
                catch (CryptographicException)
                {
                    // MAC validation failed
                    throw new InvalidOperationException("Falha na autenticação do dado (tag inválida ou chave incorreta).");
                }
            }

            string jsonString = Encoding.UTF8.GetString(plainBytes);

            if (typeof(T) == typeof(string))
            {
                return (T)(object)jsonString;
            }

            return JsonSerializer.Deserialize<T>(jsonString);
        }
    }
}
