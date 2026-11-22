export function validateResetPassword(password: string, confirmation: string): string | null {
  if (password.length < 12) return "Use uma senha com pelo menos 12 caracteres.";
  if (password !== confirmation) return "As senhas precisam ser iguais.";
  return null;
}