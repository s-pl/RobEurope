import React, { useMemo, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { apiRequest, resolveMediaUrl } from '../../lib/apiClient';

const baseToolbar = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike', 'blockquote'],
  [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
  ['link', 'image'],
  ['clean']
];

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'indent',
  'link', 'image'
];

export const RichTextEditor = ({ value, onChange, placeholder }) => {
  const quillRef = useRef(null);

  const modules = useMemo(() => ({
    toolbar: {
      container: baseToolbar,
      handlers: {
        image: async function imageHandler() {
          try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async () => {
              const file = input.files?.[0];
              if (!file) return;
              const fd = new FormData();
              fd.append('file', file);
              const media = await apiRequest('/media', { method: 'POST', body: fd, formData: true });
              const quill = quillRef.current?.getEditor?.();
              if (!quill) return;
              const range = quill.getSelection(true);
              const url = resolveMediaUrl(media.url);
              quill.insertEmbed(range ? range.index : 0, 'image', url, 'user');
              // move cursor after image
              if (range) quill.setSelection(range.index + 1, 0);
            };
            input.click();
          } catch (err) {
            console.error('Image upload failed', err);
          }
        }
      }
    }
  }), []);

  return (
    <div className="rich-text-editor [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:max-h-[300px] [&_.ql-editor]:overflow-y-auto [&_.ql-container]:rounded-b-md [&_.ql-toolbar]:rounded-t-md [&_.ql-container]:border-slate-200 [&_.ql-toolbar]:border-slate-200 dark:[&_.ql-container]:border-slate-800 dark:[&_.ql-toolbar]:border-slate-800 dark:[&_.ql-toolbar]:bg-slate-900 dark:[&_.ql-container]:bg-slate-950 dark:[&_.ql-picker]:text-slate-200 dark:[&_.ql-stroke]:stroke-slate-200 dark:[&_.ql-fill]:fill-slate-200">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={(val) => {
          // Strip pasted base64 images to avoid huge content and suggest toolbar upload instead
          if (typeof val === 'string' && val.includes('src="data:')) {
            const cleaned = val.replace(/<img[^>]+src=\"data:[^\"]+\"[^>]*>/gi, '');
            console.warn('Removed base64 images from content. Use the image button to upload.');
            onChange?.(cleaned);
            return;
          }
          onChange?.(val);
        }}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
};
