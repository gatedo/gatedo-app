import LegalDocument from './LegalDocument';

const sections = [
  {
    title: 'Ao acessar, instalar ou utilizar',
    blocks: [
      'Ao acessar, instalar ou utilizar o aplicativo GATEDO, voce concorda com os presentes Termos de Uso. Recomendamos a leitura completa antes da utilizacao dos servicos.',
      'Caso voce nao concorde com estes termos, nao utilize o aplicativo.',
    ],
  },
  {
    title: '1. Sobre o Gatedo',
    blocks: [
      'O GATEDO e uma plataforma digital voltada ao cuidado, registro, acompanhamento, identidade e bem-estar de gatos, oferecendo recursos como:',
      [
        'registro de perfil felino digital',
        'prontuario e historico clinico',
        'geracao de documentos organizados',
        'suporte informativo com inteligencia artificial (iGentVet)',
        'recursos criativos com IA (Studio GATEDO)',
        'comunidade social felina (Comunigato)',
        'conteudos educativos (GATEDO PEDIA)',
        'memorial digital respeitoso para gatos falecidos',
        'sistema de gamificacao com pontos e niveis',
      ],
      'O aplicativo nao substitui atendimento veterinario profissional.',
    ],
  },
  {
    title: '2. Aceitacao dos Termos',
    blocks: [
      'Ao utilizar o aplicativo, voce declara que:',
      [
        'possui capacidade legal para aceitar estes termos',
        'fornecera informacoes verdadeiras',
        'utilizara o aplicativo de forma responsavel e etica',
        'respeitara as regras da comunidade',
      ],
    ],
  },
  {
    title: '3. Propriedade Intelectual',
    blocks: [
      'O aplicativo GATEDO, incluindo design, interface, identidade visual, banco de dados, algoritmos, recursos de IA, textos, marca GATEDO e conteudos exclusivos, sao protegidos por direitos autorais e propriedade intelectual.',
      'Voce nao pode copiar, modificar, redistribuir, extrair codigo, criar versoes derivadas ou utilizar a marca sem autorizacao.',
    ],
  },
  {
    title: '4. Finalidade do Aplicativo',
    blocks: [
      'O GATEDO e uma plataforma de organizacao, acompanhamento, orientacao assistiva, documentacao e comunidade.',
      'O aplicativo nao realiza diagnostico veterinario.',
      'As respostas geradas pelo modulo iGentVet sao informativas e educativas, e nao substituem consulta clinica presencial.',
      'Sempre procure um veterinario em situacoes de urgencia.',
    ],
  },
  {
    title: '5. Responsabilidades do Usuario',
    blocks: [
      'Ao utilizar o aplicativo, voce concorda em manter seus dados atualizados, proteger seu acesso, nao compartilhar credenciais, utilizar o app de forma etica, nao publicar conteudo ofensivo ou ilegal e nao publicar conteudo falso sobre saude animal.',
      'Tambem e sua responsabilidade manter conexao ativa com internet, bateria do dispositivo suficiente e dispositivo compativel com atualizacoes.',
    ],
  },
  {
    title: '6. Uso da Inteligencia Artificial',
    blocks: [
      'O GATEDO utiliza recursos de inteligencia artificial para geracao de conteudos, organizacao de dados, suporte informativo, criacao visual e relatorios assistivos.',
      'Esses recursos podem conter limitacoes, dependem de dados fornecidos pelo usuario e nao substituem profissionais.',
      'O usuario e responsavel pela interpretacao das informacoes.',
    ],
  },
  {
    title: '7. Dados do Pet e Documentos',
    blocks: [
      'Ao inserir informacoes no aplicativo, voce declara ser responsavel pelo animal ou possuir autorizacao para registrar os dados.',
      'Documentos enviados podem incluir receitas, exames, laudos e historico clinico.',
      'Esses arquivos permanecem vinculados a conta do usuario conforme a politica de privacidade.',
    ],
  },
  {
    title: '8. Comunidade Comunigato',
    blocks: [
      'O ambiente social do aplicativo permite interacao entre tutores.',
      'Nao e permitido discurso de odio, conteudo ofensivo, divulgacao enganosa, spam, venda irregular ou desinformacao veterinaria.',
      'O GATEDO podera remover conteudos que violem estas regras.',
    ],
  },
  {
    title: '9. Sistema de Pontos e Gamificacao',
    blocks: [
      'O aplicativo utiliza sistemas internos como GPTS (pontos do sistema), XPT (experiencia do tutor) e XPG (experiencia do gato).',
      'Esses pontos nao possuem valor financeiro, nao sao convertiveis em dinheiro e podem ser alterados conforme evolucao da plataforma.',
    ],
  },
  {
    title: '10. Servicos de Terceiros',
    blocks: [
      'O aplicativo pode utilizar servicos externos como Google Play Services, Firebase, APIs de inteligencia artificial, provedores de hospedagem, servicos de pagamento e provedores de analise de desempenho.',
      'O uso desses servicos esta sujeito tambem aos termos proprios de cada fornecedor.',
    ],
  },
  {
    title: '11. Conectividade e Custos de Dados',
    blocks: [
      'Alguns recursos exigem conexao com internet.',
      'O GATEDO nao se responsabiliza por indisponibilidade de rede, custos de dados moveis ou cobrancas de roaming. Esses custos sao responsabilidade do usuario.',
    ],
  },
  {
    title: '12. Atualizacoes do Aplicativo',
    blocks: [
      'O GATEDO podera atualizar funcionalidades, modificar recursos, alterar interfaces, corrigir falhas e ajustar planos e beneficios.',
      'Algumas atualizacoes podem ser obrigatorias para continuidade do uso.',
    ],
  },
  {
    title: '13. Planos, Beneficios e Funcionalidades Premium',
    blocks: [
      'Alguns recursos podem incluir beneficios de fundador, recursos avancados de IA, creditos de uso e funcionalidades futuras premium.',
      'O GATEDO podera criar novos planos, alterar valores e ajustar beneficios, sempre com aviso previo quando aplicavel.',
    ],
  },
  {
    title: '14. Limitacao de Responsabilidade',
    blocks: [
      'O GATEDO nao se responsabiliza por decisoes tomadas com base em conteudos do app, falhas causadas por terceiros, indisponibilidade temporaria, perda de conexao ou mau uso da plataforma.',
      'O aplicativo e fornecido como ferramenta de apoio ao tutor.',
    ],
  },
  {
    title: '15. Encerramento de Acesso',
    blocks: [
      'O acesso podera ser suspenso em caso de violacao dos termos, uso indevido, fraude ou comportamento abusivo.',
      'O GATEDO tambem podera encerrar o servico futuramente mediante aviso.',
    ],
  },
  {
    title: '16. Privacidade',
    blocks: [
      'O tratamento de dados segue a Politica de Privacidade do GATEDO. Recomendamos leitura complementar.',
    ],
  },
  {
    title: '17. Alteracoes Destes Termos',
    blocks: [
      'Estes termos podem ser atualizados periodicamente.',
      'Sempre que houver alteracoes relevantes, notificaremos dentro do aplicativo ou publicaremos nova versao nesta pagina.',
    ],
  },
  {
    title: '18. Contato',
    blocks: ['Em caso de duvidas, sugestoes ou solicitacoes: contato@gatedo.com'],
  },
];

export default function TermsOfUse() {
  return (
    <LegalDocument
      title="Termos de Uso - Gatedo App"
      updatedAt="30 de abril de 2026"
      sections={sections}
    />
  );
}
