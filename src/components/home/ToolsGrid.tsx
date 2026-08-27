import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  Layers,
  Scissors,
  Minimize2,
  Image as ImageIcon,
  FilePlus,
  FileText,
  FileCheck,
  RefreshCw,
  Printer,
  Stamp,
  RotateCw,
  Lock,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { TOOLS } from '../../data/tools';
import { ToolId, ToolDefinition } from '../../types';

interface ToolsGridProps {
  onSelectTool: (toolId: ToolId) => void;
}

export function ToolsGrid({ onSelectTool }: ToolsGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'All Tools' },
    { id: 'core-pdf', label: 'Core PDF' },
    { id: 'convert-from-pdf', label: 'Convert from PDF' },
    { id: 'convert-to-pdf', label: 'Convert to PDF' },
    { id: 'image-tools', label: 'Image Tools' },
    { id: 'security-print', label: 'Security & Print' },
  ];

  const filteredTools = TOOLS.filter((tool) => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.shortDesc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case 'Layers':
        return <Layers className="w-5 h-5" />;
      case 'Scissors':
        return <Scissors className="w-5 h-5" />;
      case 'Minimize2':
        return <Minimize2 className="w-5 h-5" />;
      case 'Image':
        return <ImageIcon className="w-5 h-5" />;
      case 'FilePlus':
        return <FilePlus className="w-5 h-5" />;
      case 'FileText':
        return <FileText className="w-5 h-5" />;
      case 'FileCheck':
        return <FileCheck className="w-5 h-5" />;
      case 'RefreshCw':
        return <RefreshCw className="w-5 h-5" />;
      case 'Printer':
        return <Printer className="w-5 h-5" />;
      case 'Stamp':
        return <Stamp className="w-5 h-5" />;
      case 'RotateCw':
        return <RotateCw className="w-5 h-5" />;
      case 'Lock':
        return <Lock className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getToolColorTheme = (id: ToolId) => {
    switch (id) {
      case 'merge-pdf':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20 group-hover:border-rose-500/50 group-hover:bg-rose-500/20';
      case 'split-pdf':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20 group-hover:border-amber-500/50 group-hover:bg-amber-500/20';
      case 'compress-pdf':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 group-hover:border-emerald-500/50 group-hover:bg-emerald-500/20';
      case 'pdf-to-image':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20 group-hover:border-purple-500/50 group-hover:bg-purple-500/20';
      case 'image-to-pdf':
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 group-hover:border-indigo-500/50 group-hover:bg-indigo-500/20';
      case 'pdf-to-word':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20 group-hover:border-blue-500/50 group-hover:bg-blue-500/20';
      case 'image-converter':
        return 'text-teal-400 bg-teal-500/10 border-teal-500/20 group-hover:border-teal-500/50 group-hover:bg-teal-500/20';
      case 'print-pdf':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/20 group-hover:border-sky-500/50 group-hover:bg-sky-500/20';
      default:
        return 'text-slate-300 bg-slate-800 border-slate-700 group-hover:border-slate-500';
    }
  };

  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header with Search & Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight">
            Complete PDF & Image Toolbox
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Engineered for precision, speed, and privacy. Choose a tool below.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools (e.g. compress)..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tool Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {filteredTools.map((tool) => (
          <motion.div
            key={tool.id}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.15 }}
            onClick={() => onSelectTool(tool.id)}
            className="group relative rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 p-5 cursor-pointer shadow-md hover:shadow-xl transition-all flex flex-col justify-between"
          >
            {/* Top row with icon & badge */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-4">
                <div
                  className={`p-3 rounded-xl border transition-all ${getToolColorTheme(tool.id)}`}
                >
                  {getToolIcon(tool.icon)}
                </div>

                {tool.badge && (
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                      tool.badge === 'Popular'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : tool.badge === 'Pro'
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        : tool.badge === 'New'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {tool.badge}
                  </span>
                )}
              </div>

              <h3 className="text-base font-heading font-bold text-white group-hover:text-rose-400 transition-colors">
                {tool.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                {tool.shortDesc}
              </p>
            </div>

            {/* Bottom launcher prompt */}
            <div className="pt-5 mt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-white">
              <span>{tool.actionText}</span>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </motion.div>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800">
          <p className="text-sm font-semibold text-slate-300">No tools found matching &quot;{searchQuery}&quot;</p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="mt-3 text-xs text-rose-400 font-bold hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </section>
  );
}
