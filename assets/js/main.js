// Comportamentos do site. Sem dependências; o site funciona sem JS (menu vira lista visível).

(() => {
  'use strict';

  // ---------- Sombra do cabeçalho depois de rolar ----------
  const cabecalho = document.getElementById('cabecalho');
  if (cabecalho) {
    const atualizarSombra = () => cabecalho.classList.toggle('rolou', window.scrollY > 4);
    atualizarSombra();
    window.addEventListener('scroll', atualizarSombra, { passive: true });
  }

  // ---------- Menu mobile (painel em tela cheia) ----------
  const menu = document.getElementById('menu');
  const abrir = document.querySelector('[data-abrir-menu]');
  const fechar = menu ? menu.querySelector('[data-fechar-menu]') : null;
  if (!menu || !abrir || !fechar) return;

  const desktop = window.matchMedia('(min-width: 1024px)');
  const focaveis = () => [...menu.querySelectorAll('a[href], button:not([disabled])')]
    .filter((el) => el.offsetParent !== null);

  const abrirMenu = () => {
    menu.classList.add('aberto');
    abrir.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    fechar.focus();
  };

  const fecharMenu = ({ devolverFoco = true } = {}) => {
    if (!menu.classList.contains('aberto')) return;
    menu.classList.remove('aberto');
    abrir.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (devolverFoco) abrir.focus();
  };

  abrir.addEventListener('click', abrirMenu);
  fechar.addEventListener('click', () => fecharMenu());

  // Clicar num link fecha o painel e deixa a âncora rolar normalmente
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a[href^="#"]')) fecharMenu({ devolverFoco: false });
  });

  // Esc fecha; Tab fica preso dentro do painel enquanto aberto
  document.addEventListener('keydown', (e) => {
    if (!menu.classList.contains('aberto')) return;
    if (e.key === 'Escape') {
      fecharMenu();
      return;
    }
    if (e.key !== 'Tab') return;
    const lista = focaveis();
    const primeiro = lista[0];
    const ultimo = lista[lista.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primeiro.focus();
    }
  });

  // Se a tela crescer para desktop com o painel aberto, fecha sem travar a rolagem
  desktop.addEventListener('change', (e) => {
    if (e.matches) fecharMenu({ devolverFoco: false });
  });
})();

// ---------- Animações de entrada ----------
// Inspiradas no componente "About Section" (21st.dev): desfoque + deslize ao entrar na tela,
// em sequência curta, e o título do hero com palavras surgindo. Só roda se o <head> marcou .anim.
(() => {
  'use strict';
  const raiz = document.documentElement;
  if (!raiz.classList.contains('anim')) return;

  const PASSO = 80;      // ms entre itens do mesmo grupo
  const MAX_ITENS = 6;   // depois disso, sem atraso extra (nada fica esperando demais)

  // Hero: divide o título em palavras e encadeia rótulo → palavras → texto → botões
  const h1 = document.querySelector('.hero h1');
  const conteudoHero = document.querySelector('.hero__conteudo');
  if (h1 && conteudoHero) {
    const palavras = h1.textContent.trim().split(' ');
    h1.textContent = '';
    palavras.forEach((p, i) => {
      const janela = document.createElement('span');
      janela.className = 'palavra';
      const interno = document.createElement('span');
      interno.textContent = p;
      interno.style.setProperty('--atraso', `${150 + i * 90}ms`);
      janela.append(interno);
      h1.append(janela);
      if (i < palavras.length - 1) h1.append(' ');
    });
    const depoisDoTitulo = 150 + palavras.length * 90 + 150;
    [['.eyebrow', 0], ['.lead', depoisDoTitulo], ['.hero__acoes', depoisDoTitulo + PASSO]].forEach(([sel, atraso]) => {
      const el = conteudoHero.querySelector(sel);
      if (!el) return;
      el.classList.add('revelar');
      el.style.setProperty('--atraso', `${atraso}ms`);
    });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      raiz.classList.add('hero-pronto');
      const itensHero = conteudoHero.querySelectorAll('.revelar');
      itensHero.forEach((el) => el.classList.add('revelado'));
      setTimeout(() => itensHero.forEach((el) => {
        el.classList.remove('revelar', 'revelado');
        el.style.removeProperty('--atraso');
      }), depoisDoTitulo + PASSO + 700);
    }));
  } else {
    raiz.classList.add('hero-pronto');
  }

  // Grupos que entram juntos, cada item com um pequeno atraso em relação ao anterior
  const grupos = [
    ['.resumo__cartao', ':scope > div > *, .resumo__item'],
    ['.numeros__lista', ':scope > li'],
    ['.secao__cabeca', ':scope > *'],
    ['.cursos__lista > li', ':scope > .curso'],
    ['.porque__lista', ':scope > li'],
    ['.porque__foto', null],
    ['.formato__grade', '.formato__midia, .formato__texto > :not(ul), .formato__bloco'],
    ['.banner', '.banner__texto > *, .prof'],
    ['.inscricao', null],
    ['.condicoes__grade', ':scope > *'],
    ['.faq__lista', ':scope > details'],
    ['.contato', null],
    ['.cta-final .container', ':scope > *'],
    ['.rodape__grade', ':scope > *'],
  ];

  const mapa = new Map();
  grupos.forEach(([seletor, itens]) => {
    document.querySelectorAll(seletor).forEach((grupo) => {
      const lista = itens ? [...grupo.querySelectorAll(itens)] : [grupo];
      if (!lista.length) return;
      lista.forEach((el, i) => {
        el.classList.add('revelar');
        el.style.setProperty('--atraso', `${Math.min(i, MAX_ITENS) * PASSO}ms`);
      });
      mapa.set(grupo, lista);
    });
  });

  // Depois de aparecer, limpa as classes: nada de filtro/transform sobrando nos componentes
  const limpar = (el) => {
    el.classList.remove('revelar', 'revelado');
    el.style.removeProperty('--atraso');
  };

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      observador.unobserve(entrada.target);
      const lista = mapa.get(entrada.target) || [];
      lista.forEach((el) => el.classList.add('revelado'));
      const duracao = 600 + Math.min(lista.length, MAX_ITENS + 1) * PASSO + 100;
      setTimeout(() => lista.forEach(limpar), duracao);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  mapa.forEach((_, grupo) => observador.observe(grupo));
})();

// ---------- Validação dos formulários ----------
// O destino do envio ainda não foi definido (decisão D7). Enquanto isso, o formulário valida
// os campos e avisa, sem fingir que enviou. Quando houver destino, trocar o bloco marcado abaixo.
(() => {
  'use strict';

  const mensagens = {
    nome: 'Informe seu nome completo.',
    email: 'Informe um e-mail válido, por exemplo nome@empresa.com.br.',
    whatsapp: 'Informe o número com DDD, por exemplo (11) 91234-5678.',
    interesse: 'Escolha um MBA, ou "Ainda não sei".',
    mensagem: 'Escreva sua mensagem.',
    consentimento: 'É preciso autorizar o uso dos dados para enviar.',
  };

  const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const digitos = (v) => v.replace(/\D/g, '');

  const erroDo = (campo) => {
    if (campo.type === 'checkbox') return campo.checked ? '' : mensagens[campo.name];
    const valor = campo.value.trim();
    if (!valor) return campo.required ? mensagens[campo.name] : '';
    if (campo.type === 'email' && !emailValido(valor)) return mensagens.email;
    if (campo.type === 'tel' && (digitos(valor).length < 10 || digitos(valor).length > 13)) return mensagens.whatsapp;
    if (campo.name === 'nome' && valor.length < 3) return mensagens.nome;
    return '';
  };

  const mostrar = (campo, texto) => {
    const alvo = document.getElementById(`${campo.id}-erro`);
    if (alvo) alvo.textContent = texto;
    if (texto) campo.setAttribute('aria-invalid', 'true');
    else campo.removeAttribute('aria-invalid');
  };

  document.querySelectorAll('form.form').forEach((form) => {
    const campos = [...form.querySelectorAll('input, select, textarea')];
    const status = form.querySelector('.form__status');

    // Depois do primeiro erro, revalida ao sair do campo (não interrompe quem ainda está digitando)
    campos.forEach((campo) => {
      const evento = campo.type === 'checkbox' || campo.tagName === 'SELECT' ? 'change' : 'blur';
      campo.addEventListener(evento, () => {
        if (campo.hasAttribute('aria-invalid')) mostrar(campo, erroDo(campo));
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      status.textContent = '';
      let primeiroInvalido = null;
      campos.forEach((campo) => {
        const texto = erroDo(campo);
        mostrar(campo, texto);
        if (texto && !primeiroInvalido) primeiroInvalido = campo;
      });

      if (primeiroInvalido) {
        primeiroInvalido.focus();
        return;
      }

      // >>> Trocar por envio real quando o destino for definido (D7) <<<
      status.textContent = 'Site em desenvolvimento: o envio ainda não está configurado e seus dados não foram enviados.';
    });
  });
})();
