"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
const ADMIN_EMAIL = 'diegobocktavares@gmail.com';
const DEFAULT_PASSWORD = '12345678';
async function safeExec(label, fn) {
    try {
        const result = await fn();
        console.log(`✅ ${label}`);
        return result;
    }
    catch (error) {
        console.warn(`⚠️ ${label} falhou: ${error?.message || error}`);
        return null;
    }
}
async function upsertUser(data) {
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    return prisma.user.upsert({
        where: { email: data.email },
        update: {
            password: hash,
            name: data.name,
            role: data.role,
            status: data.status,
            plan: data.plan,
            badges: data.badges || [],
            emailVerified: data.emailVerified ?? true,
            photoUrl: data.photoUrl ?? null,
        },
        create: {
            email: data.email,
            password: hash,
            name: data.name,
            role: data.role,
            status: data.status,
            plan: data.plan,
            badges: data.badges || [],
            emailVerified: data.emailVerified ?? true,
            photoUrl: data.photoUrl ?? null,
        },
    });
}
async function ensureTutorMeta(userId, points = 300, credits = 300) {
    await safeExec(`TutorPoints ${userId}`, () => prisma.tutorPoints.upsert({
        where: { userId },
        update: {
            points,
            totalEarned: points,
            lastActionAt: new Date(),
        },
        create: {
            userId,
            points,
            totalEarned: points,
            lastActionAt: new Date(),
        },
    }));
    await safeExec(`UserCredits ${userId}`, () => prisma.userCredits.upsert({
        where: { userId },
        update: {
            balance: credits,
            totalBought: credits,
            totalUsed: 0,
        },
        create: {
            userId,
            balance: credits,
            totalBought: credits,
            totalUsed: 0,
        },
    }));
}
async function ensureFounderConfig() {
    await prisma.founderPhaseConfig.upsert({
        where: { phase: 1 },
        update: { price: 47, maxSlots: 50, soldSlots: 0, active: true },
        create: { phase: 1, price: 47, maxSlots: 50, soldSlots: 0, active: true },
    });
    await prisma.appSettings.upsert({
        where: { key: 'faseAtiva' },
        update: { value: '1' },
        create: { key: 'faseAtiva', value: '1' },
    });
}
async function createNoticeIfMissing(prisma, notice) {
    const existing = await prisma.notice.findFirst({
        where: { title: notice.title },
    });
    if (existing)
        return existing;
    return prisma.notice.create({
        data: {
            title: notice.title,
            content: notice.content,
            type: notice.type ?? 'INFO',
            isActive: notice.isActive ?? true,
            xpReward: notice.xpReward ?? 3,
            expiresAt: notice.expiresAt ?? null,
        },
    });
}
async function main() {
    console.log('🌱 Iniciando seed...');
    const admin = await upsertUser({
        email: ADMIN_EMAIL,
        name: 'Diego Bock',
        role: 'ADMIN',
        status: 'ACTIVE',
        plan: 'FOUNDER',
        badges: ['FOUNDER'],
    });
    const userA = await upsertUser({
        email: 'gateira.teste@gatedo.com',
        name: 'Marina Lopes',
        role: 'USER',
        status: 'ACTIVE',
        plan: 'FOUNDER',
    });
    const userB = await upsertUser({
        email: 'tutor.teste@gatedo.com',
        name: 'Rafael Lima',
        role: 'USER',
        status: 'ACTIVE',
        plan: 'FREE',
    });
    await ensureTutorMeta(admin.id, 999999, 999999);
    await ensureTutorMeta(userA.id, 220, 180);
    await ensureTutorMeta(userB.id, 180, 120);
    await ensureFounderConfig();
    await createNoticeIfMissing(prisma, {
        title: 'Bem-vindo ao Comunigato',
        content: 'A comunidade do GATEDO está em fase beta. Algumas funções podem evoluir nas próximas atualizações.',
        type: 'UPDATE',
        xpReward: 3,
    });
    await createNoticeIfMissing(prisma, {
        title: 'Gamificação ativa',
        content: 'Agora você pode ganhar XP ao interagir com comunicados oficiais dentro do app.',
        type: 'INFO',
        xpReward: 3,
    });
    await createNoticeIfMissing(prisma, {
        title: 'Comunigato está em versão Beta',
        content: 'Você faz parte dos primeiros tutores do GATEDO. Explore a comunidade.',
        type: 'UPDATE',
        xpReward: 3,
    });
    await createNoticeIfMissing(prisma, {
        title: 'Agora você pode transformar criações em posts',
        content: 'Use o Studio, publique no Comunigato e fortaleça seu perfil.',
        type: 'INFO',
        xpReward: 3,
    });
    await createNoticeIfMissing(prisma, {
        title: 'Salve conteúdos favoritos para rever depois',
        content: 'Use o marcador dos posts para montar sua coleção de referências.',
        type: 'INFO',
        xpReward: 2,
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Seed concluído');
    console.log(`Admin: ${ADMIN_EMAIL}`);
    console.log(`Senha: ${DEFAULT_PASSWORD}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━');
}
main()
    .catch((e) => {
    console.error('❌ Seed falhou:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map