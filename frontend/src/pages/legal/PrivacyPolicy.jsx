import LegalDocument from './LegalDocument';

const sections = [
  {
    title: 'Introducao',
    blocks: [
      'Esta Politica de Privacidade descreve como o GATEDO coleta, utiliza, armazena e protege as informacoes dos usuarios do aplicativo.',
      'Ao utilizar o aplicativo GATEDO, voce concorda com os termos desta politica.',
      'Caso nao concorde, recomendamos que nao utilize o aplicativo.',
    ],
  },
  {
    title: '1. Sobre o Gatedo',
    blocks: [
      'O GATEDO e uma plataforma digital dedicada ao cuidado, registro, acompanhamento e bem-estar de gatos, oferecendo identidade digital felina, prontuario clinico organizado, suporte assistivo com inteligencia artificial, acompanhamento de saude preditiva, comunidade social de tutores, recursos criativos com IA, conteudos educativos e memorial digital respeitoso.',
    ],
  },
  {
    title: '2. Dados Coletados',
    blocks: [
      'Podemos coletar os seguintes tipos de informacoes:',
      [
        'Dados do usuario: nome, e-mail, foto de perfil opcional, cidade opcional, preferencias dentro do aplicativo e interacoes com funcionalidades.',
        'Dados do pet: nome do gato, idade aproximada, raca, peso, historico clinico informado pelo tutor, comportamento, alimentacao, ambiente, imagens enviadas e documentos veterinarios anexados.',
      ],
      'Essas informacoes sao inseridas voluntariamente pelo usuario.',
    ],
  },
  {
    title: '3. Documentos Clinicos Inseridos',
    blocks: [
      'O aplicativo permite armazenar documentos como receitas, exames, laudos veterinarios e comprovantes de vacinacao.',
      'Esses arquivos pertencem ao usuario, ficam vinculados a conta e podem ser removidos pelo proprio tutor.',
      'O GATEDO nao altera documentos enviados.',
    ],
  },
  {
    title: '4. Uso da Inteligencia Artificial',
    blocks: [
      'O GATEDO utiliza IA para organizar informacoes, gerar conteudos educativos, auxiliar na interpretacao de registros, gerar imagens criativas e apoiar relatorios assistivos.',
      'A IA nao substitui veterinarios, nao realiza diagnostico clinico e depende dos dados inseridos pelo usuario.',
    ],
  },
  {
    title: '5. Finalidade do Uso dos Dados',
    blocks: [
      'Utilizamos os dados para funcionamento do aplicativo, personalizacao da experiencia, organizacao do prontuario felino, suporte informativo com IA, funcionamento da comunidade, melhoria continua da plataforma e correcao de falhas tecnicas.',
      'Nunca vendemos dados pessoais dos usuarios.',
    ],
  },
  {
    title: '6. Dados da Comunidade (Comunigato)',
    blocks: [
      'Caso o usuario publique conteudos na comunidade, como fotos, comentarios, postagens e interacoes, essas informacoes poderao ser visiveis para outros usuarios conforme as configuracoes de privacidade selecionadas.',
      'O usuario pode remover conteudos publicados a qualquer momento.',
    ],
  },
  {
    title: '7. Armazenamento de Dados',
    blocks: [
      'Seus dados podem ser armazenados em servidores seguros utilizados pelo GATEDO ou seus parceiros tecnologicos.',
      'Utilizamos medidas como criptografia, controle de acesso, autenticacao protegida e monitoramento de seguranca para proteger as informacoes.',
    ],
  },
  {
    title: '8. Servicos de Terceiros',
    blocks: [
      'O GATEDO pode utilizar servicos externos como Google Play Services, Firebase, provedores de IA, provedores de hospedagem, ferramentas de analytics e servicos de autenticacao.',
      'Esses servicos possuem politicas proprias. Recomendamos que sejam consultadas quando necessario.',
    ],
  },
  {
    title: '9. Uso de Imagens Enviadas pelo Usuario',
    blocks: [
      'Imagens enviadas podem ser utilizadas para perfil do pet, galeria do tutor, geracao criativa no Studio IA e documentos digitais.',
      'O usuario mantem os direitos sobre as imagens enviadas.',
    ],
  },
  {
    title: '10. Compartilhamento de Dados',
    blocks: [
      'O GATEDO nao vende dados pessoais.',
      'Os dados somente poderao ser compartilhados quando necessario para funcionamento do aplicativo, exigido por lei, autorizado pelo usuario ou necessario para integracao com servicos essenciais.',
    ],
  },
  {
    title: '11. Direitos do Usuario (LGPD)',
    blocks: [
      'Voce pode solicitar acesso aos seus dados, correcao de dados, exclusao de dados, exportacao das informacoes e revogacao de consentimento.',
      'Solicitacoes podem ser feitas pelo canal oficial de contato.',
    ],
  },
  {
    title: '12. Seguranca da Conta',
    blocks: [
      'Recomendamos nao compartilhar senha, manter o dispositivo protegido e evitar acesso em aparelhos desconhecidos.',
      'O usuario e responsavel pelo acesso a propria conta.',
    ],
  },
  {
    title: '13. Retencao de Dados',
    blocks: [
      'Mantemos os dados enquanto a conta estiver ativa, houver necessidade tecnica ou houver obrigacao legal.',
      'Apos exclusao da conta, os dados poderao ser removidos conforme prazos legais aplicaveis.',
    ],
  },
  {
    title: '14. Menores de Idade',
    blocks: [
      'O aplicativo e destinado a tutores responsaveis por animais.',
      'Caso menores utilizem o aplicativo, recomenda-se supervisao de responsaveis legais.',
    ],
  },
  {
    title: '15. Alteracoes Nesta Politica',
    blocks: [
      'Podemos atualizar esta Politica de Privacidade periodicamente.',
      'Sempre que houver mudancas relevantes, notificaremos dentro do aplicativo ou publicaremos nova versao nesta pagina.',
    ],
  },
  {
    title: '16. Contato',
    blocks: ['Duvidas, solicitacoes ou questoes sobre privacidade: contato@gatedo.com'],
  },
];

export default function PrivacyPolicy() {
  return (
    <LegalDocument
      title="Politica de Privacidade - Gatedo App"
      updatedAt="30 de abril de 2026"
      sections={sections}
    />
  );
}
