"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.ProductController = {
    async index(req, res) {
        try {
            const products = await prisma.product.findMany({
                include: { category: true },
                orderBy: { createdAt: 'desc' }
            });
            return res.json(products);
        }
        catch (error) {
            console.error("Erro ao listar produtos:", error);
            return res.status(500).json({ error: "Erro ao buscar produtos" });
        }
    },
    async store(req, res) {
        try {
            const { name, price, category, partner, link, images, videoReview, badge, description } = req.body;
            let categoryRecord = await prisma.category.findFirst({
                where: { name: category }
            });
            if (!categoryRecord) {
                categoryRecord = await prisma.category.create({
                    data: { name: category }
                });
            }
            const product = await prisma.product.create({
                data: {
                    name,
                    price: parseFloat(price.replace('R$', '').replace('.', '').replace(',', '.').trim()) || 0,
                    description: description || "",
                    images: Array.isArray(images) ? images : [],
                    externalLink: link,
                    platform: partner,
                    badge: badge || null,
                    videoReview: videoReview || null,
                    categoryId: categoryRecord.id,
                    stock: 0,
                    isDigital: false
                },
                include: { category: true }
            });
            return res.status(201).json(product);
        }
        catch (error) {
            console.error("Erro no cadastro:", error);
            return res.status(400).json({ error: "Erro ao cadastrar produto" });
        }
    },
    async delete(req, res) {
        try {
            const { id } = req.params;
            await prisma.product.delete({
                where: { id: String(id) }
            });
            return res.status(204).send();
        }
        catch (error) {
            console.error("Erro ao deletar:", error);
            return res.status(400).json({ error: "Erro ao deletar produto" });
        }
    }
};
//# sourceMappingURL=ProductController.js.map