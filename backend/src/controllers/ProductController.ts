import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const ProductController = {
  // LISTAR PRODUTOS
  async index(req: Request, res: Response) {
    try {
      const products = await prisma.product.findMany({
        include: { category: true },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(products);
    } catch (error) {
      console.error("Erro ao listar produtos:", error);
      return res.status(500).json({ error: "Erro ao buscar produtos" });
    }
  },

  // SALVAR/CRIAR PRODUTO
  async store(req: Request, res: Response) {
    try {
      const { 
        name, price, category, partner, link, 
        images, videoReview, badge, description 
      } = req.body;

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
          platform: partner, // Ajustado para o campo correto do seu schema
          badge: badge || null,
          videoReview: videoReview || null,
          categoryId: categoryRecord.id,
          stock: 0,
          isDigital: false
        },
        include: { category: true }
      });

      return res.status(201).json(product);
    } catch (error) {
      console.error("Erro no cadastro:", error);
      return res.status(400).json({ error: "Erro ao cadastrar produto" });
    }
  },

  // DELETAR PRODUTO (ONDE ESTAVA O ERRO TS2322)
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // CORREÇÃO: Forçamos o id a ser interpretado como string única
      await prisma.product.delete({
        where: { id: String(id) } 
      });

      return res.status(204).send();
    } catch (error) {
      console.error("Erro ao deletar:", error);
      return res.status(400).json({ error: "Erro ao deletar produto" });
    }
  }
};