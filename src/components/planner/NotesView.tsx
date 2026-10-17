import React, { useState } from 'react';
import { PersonalNote } from '../../types/fitness';
import {
  Search,
  Plus,
  BookOpen,
  Pin,
  Calendar,
  Tag,
  ArrowRight,
  FileText,
} from 'lucide-react';

interface NotesViewProps {
  notes: PersonalNote[];
  onOpenNoteEditor: (note?: PersonalNote) => void;
  onRefresh: () => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  onOpenNoteEditor,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'Journal', 'Workout Reflection', 'Ideas', 'Project', 'General'];

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.tags && n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesCategory = selectedCategory === 'all' || n.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const otherNotes = filteredNotes.filter((n) => !n.isPinned);

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#1677E8]" />
            Notes &amp; Journal
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Private workout reflections, ideas, nutrition insights, and daily thoughts
          </p>
        </div>

        <button
          onClick={() => onOpenNoteEditor()}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-[#1677E8] hover:bg-[#1361BD] text-white shadow-xs cursor-pointer self-start sm:self-auto transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, tags, or content..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#1677E8] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              {cat === 'all' ? 'All Notes' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Pinned Notes Section */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5 fill-current" />
            Pinned Notes ({pinnedNotes.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pinnedNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => onOpenNoteEditor(note)}
                className="p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent dark:from-amber-500/10 dark:to-slate-900/40 hover:border-amber-500 transition cursor-pointer flex flex-col justify-between group shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      {note.category || 'General'}
                    </span>
                    <Pin className="w-3.5 h-3.5 text-amber-500 fill-current shrink-0" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-[#1677E8] transition line-clamp-1">
                    {note.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-3 leading-relaxed">
                    {note.content}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                  {note.linkedDate ? (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#12B8C7]" />
                      {note.linkedDate}
                    </span>
                  ) : (
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  )}

                  {note.tags && note.tags.length > 0 && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Tag className="w-3 h-3" />
                      {note.tags.slice(0, 2).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All / Other Notes */}
      <div className="space-y-2.5">
        {pinnedNotes.length > 0 && (
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            All Notes ({otherNotes.length})
          </h3>
        )}

        {otherNotes.length === 0 && pinnedNotes.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
            <div className="w-12 h-12 rounded-2xl bg-[#1677E8]/10 text-[#1677E8] flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              No notes found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'Try a different search term or category filter.'
                : 'Record your training reflections, daily thoughts, nutrition ideas, or personal goals.'}
            </p>
            <button
              onClick={() => onOpenNoteEditor()}
              className="mt-4 px-4 py-2 rounded-xl bg-[#1677E8] hover:bg-[#1361BD] text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Note</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => onOpenNoteEditor(note)}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-[#1677E8]/50 hover:shadow-xs transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {note.category || 'General'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-[#1677E8] transition line-clamp-1">
                    {note.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-3 leading-relaxed">
                    {note.content}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  {note.linkedDate ? (
                    <span className="flex items-center gap-1 text-[#12B8C7] font-medium">
                      <Calendar className="w-3 h-3" />
                      {note.linkedDate}
                    </span>
                  ) : (
                    <span />
                  )}

                  {note.tags && note.tags.length > 0 && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <Tag className="w-3 h-3" />
                      {note.tags.slice(0, 2).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
