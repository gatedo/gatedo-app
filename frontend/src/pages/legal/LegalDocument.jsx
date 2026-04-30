import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function LegalDocument({ title, updatedAt, sections }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] px-5 py-8 md:px-8">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-black uppercase tracking-[2px] text-[#8B4AFF] shadow-sm"
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        <article className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-9">
          <div className="mb-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#F5F1FF] px-3 py-1 text-[10px] font-black uppercase tracking-[3px] text-[#8B4AFF]">
              <ShieldCheck size={14} /> Gatedo App
            </div>
            <h1 className="text-3xl font-black leading-tight text-gray-950 md:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-sm font-bold text-gray-500">
              Ultima atualizacao: {updatedAt}
            </p>
          </div>

          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section.title} className="space-y-3">
                <h2 className="text-lg font-black uppercase tracking-tight text-gray-900">
                  {section.title}
                </h2>
                {section.blocks.map((block, index) => {
                  if (Array.isArray(block)) {
                    return (
                      <ul key={index} className="space-y-2 pl-4">
                        {block.map((item) => (
                          <li key={item} className="list-disc text-sm font-medium leading-relaxed text-gray-600">
                            {item}
                          </li>
                        ))}
                      </ul>
                    );
                  }

                  return (
                    <p key={index} className="text-sm font-medium leading-relaxed text-gray-600">
                      {block}
                    </p>
                  );
                })}
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-[24px] bg-[#F8F7FF] p-5 text-sm font-bold text-gray-600">
            Duvidas, solicitacoes ou questoes sobre o Gatedo:
            <a href="mailto:contato@gatedo.com" className="ml-1 text-[#8B4AFF]">
              contato@gatedo.com
            </a>
          </div>
        </article>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 pb-10 text-xs font-black uppercase tracking-[2px] text-gray-400">
          <Link to="/terms" className="hover:text-[#8B4AFF]">Termos de uso</Link>
          <Link to="/privacy" className="hover:text-[#8B4AFF]">Politica de privacidade</Link>
        </div>
      </div>
    </div>
  );
}
