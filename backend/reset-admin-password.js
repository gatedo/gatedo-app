const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

(async () => {
  const email = 'diegobocktavares@gmail.com';
  const novaSenha = 'Admin@123456';

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.log('USUARIO_NAO_ENCONTRADO');
    return;
  }

  const hash = await bcrypt.hash(novaSenha, 10);

  await prisma.user.update({
    where: { email },
    data: { password: hash }
  });

  console.log('SENHA_RESETADA_COM_SUCESSO');
})()
.catch(console.error)
.finally(() => prisma.$disconnect());