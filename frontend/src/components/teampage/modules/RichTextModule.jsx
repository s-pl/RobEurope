import { AlignLeft } from 'lucide-react';

export default function RichTextModule({ config = {}, accentColor }) {
  const { title = '', content = '' } = config;
  const accent = accentColor || '#18181b';

  if (!content && !title) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-8 text-center">
        <AlignLeft className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
        <p className="text-sm text-zinc-400">Bloque de texto vacío</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-zinc-200 bg-white overflow-hidden"
      style={title ? { borderTopColor: accent, borderTopWidth: 3 } : {}}
    >
      {title && (
        <div className="px-5 py-3.5 border-b border-zinc-100">
          <h3 className="font-semibold text-zinc-900 text-sm">{title}</h3>
        </div>
      )}
      {content && (
        <div
          className="px-5 py-4 prose prose-sm prose-zinc max-w-none
            prose-headings:font-bold prose-headings:text-zinc-900
            prose-p:text-zinc-600 prose-p:leading-relaxed
            prose-a:text-zinc-900 prose-a:underline-offset-2
            prose-strong:text-zinc-900 prose-strong:font-semibold
            prose-ul:text-zinc-600 prose-ol:text-zinc-600
            prose-blockquote:border-l-zinc-300 prose-blockquote:text-zinc-500
            prose-code:text-zinc-800 prose-code:bg-zinc-100 prose-code:px-1 prose-code:rounded"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </div>
  );
}
