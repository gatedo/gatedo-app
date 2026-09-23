-- Tela "Como funciona" do protocolo (bloco "apresentacao") — controla se já foi vista, por inscrição.
ALTER TABLE "ProtocolEnrollment" ADD COLUMN "presentationSeenAt" TIMESTAMP(3);
