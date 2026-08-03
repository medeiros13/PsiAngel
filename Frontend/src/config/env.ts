// Centraliza o acesso às variáveis de ambiente.
// Se uma variável obrigatória não existir, podemos até "estourar" um erro aqui 
// para o app nem abrir se estiver mal configurado, evitando bugs silenciosos.

export const ENV = {
  API_URL: import.meta.env.VITE_API_URL,
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
};