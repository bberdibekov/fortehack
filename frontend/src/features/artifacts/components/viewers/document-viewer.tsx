import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DocumentViewerProps {
  content: string;
}

export const DocumentViewer = ({ content }: DocumentViewerProps) => {
  return (
    <div className="h-full w-full bg-slate-100 dark:bg-slate-900 overflow-y-auto p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-[800px] bg-white dark:bg-slate-950 min-h-[800px] shadow-sm border rounded-sm p-8 md:p-12">
        <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-xl prose-h2:border-b prose-h2:pb-2 prose-h2:mt-8 prose-p:leading-7">
           <ReactMarkdown remarkPlugins={[remarkGfm]}>
             {content}
           </ReactMarkdown>
        </article>
      </div>
    </div>
  );
};