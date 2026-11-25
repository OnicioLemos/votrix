// RN03: CPF aceito com ou sem máscara, gravado só com os 11 dígitos
// e validado pelos dígitos verificadores.

function limparCpf(cpf) {
  return String(cpf || '').replace(/\D/g, '');
}

function calcularDigito(base) {
  // base com 9 dígitos -> peso começa em 10; com 10 dígitos -> peso começa em 11
  let soma = 0;
  let peso = base.length + 1;
  for (const digito of base) {
    soma += Number(digito) * peso;
    peso--;
  }
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

function cpfValido(cpf) {
  const numeros = limparCpf(cpf);
  if (numeros.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numeros)) return false; // 111.111.111-11 etc.

  const d1 = calcularDigito(numeros.slice(0, 9));
  const d2 = calcularDigito(numeros.slice(0, 10));
  return d1 === Number(numeros[9]) && d2 === Number(numeros[10]);
}

// RNF08: CPF mascarado na interface do admin -> ***.456.789-**
function mascararCpf(cpf) {
  const n = limparCpf(cpf);
  if (n.length !== 11) return '***.***.***-**';
  return `***.${n.slice(3, 6)}.${n.slice(6, 9)}-**`;
}

module.exports = { limparCpf, cpfValido, mascararCpf };
