import React from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
    ['link', 'image'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'indent',
  'link', 'image'
];

export const RichTextEditor = ({ value, onChange, placeholder }) => {
  return (
    <div className="rich-text-editor [&_.ql-editor]:min-h-[200px] [&_.ql-container]:rounded-b-md [&_.ql-toolbar]:rounded-t-md [&_.ql-container]:border-slate-200 [&_.ql-toolbar]:border-slate-200 dark:[&_.ql-container]:border-slate-800 dark:[&_.ql-toolbar]:border-slate-800 dark:[&_.ql-toolbar]:bg-slate-900 dark:[&_.ql-container]:bg-slate-950 dark:[&_.ql-picker]:text-slate-200 dark:[&_.ql-stroke]:stroke-slate-200 dark:[&_.ql-fill]:fill-slate-200">
      <ReactQuill 
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
};
