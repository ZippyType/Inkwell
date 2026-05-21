import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  FolderPlus, 
  FileText, 
  Settings, 
  User, 
  Sun, 
  Moon, 
  ChevronRight, 
  ChevronDown, 
  Trash2,
  Edit2,
  Search,
  Type,
  Save,
  LogOut,
  LogIn,
  X,
  Check,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { cn } from '../lib/utils';
import { compressImage } from '../lib/imageUtils';
import { t } from '../lib/i18n';

export function Sidebar() {
  const { 
    language,
    projectId,
    files, 
    assets,
    customFonts,
    snippets,
    activeFileId, 
    setActiveFileId, 
    theme, 
    setTheme, 
    addPart, 
    addChapter, 
    deleteFile, 
    renameFile,
    addAsset,
    updateFileContent,
    setDraggedFileId,
    user,
    authLoading,
    login,
    logout,
    saveToFirebase,
    glossaryTerms,
    addGlossaryTerm,
    deleteGlossaryTerm
  } = useStudio();
  
  const [expandedParts, setExpandedParts] = useState<Record<string, boolean>>({});
  const [manuscriptSearch, setManuscriptSearch] = useState('');
  const [snippetSearch, setSnippetSearch] = useState('');
  const [showSnippetSearch, setShowSnippetSearch] = useState(false);
  const [isTocExpanded, setIsTocExpanded] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        try {
          // Compress if larger than 1MB (or just compress anyway for consistency)
          const compressed = await compressImage(dataUrl, 0.95); // 0.95 to be safe under 1MB
          setUploadPreview(compressed);
          setUploadName(file.name.replace(/\.[^/.]+$/, ""));
          setUploadCaption("");
        } catch (err) {
          console.error("Compression failed", err);
          setUploadPreview(dataUrl);
          setUploadName(file.name.replace(/\.[^/.]+$/, ""));
          setUploadCaption("");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const confirmUpload = async () => {
    if (!uploadPreview) return;
    setIsUploading(true);
    try {
      console.log("Starting upload for:", uploadName);
      await addAsset(uploadPreview, uploadName || 'unnamed-asset', uploadCaption);
      setUploadPreview(null);
      setUploadName('');
      setUploadCaption('');
      console.log("Upload completed");
    } catch (error) {
      console.error("Upload failed in component:", error);
      alert("Upload failed. Check connection.");
    } finally {
      setIsUploading(false);
    }
  };

  const togglePart = (id: string) => {
    setExpandedParts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const parts = files.filter(f => f.type === 'part').sort((a, b) => a.order - b.order);

  const getFilteredPartsList = () => {
    if (!manuscriptSearch) return parts;
    const lowerSearch = manuscriptSearch.toLowerCase();
    
    return parts.filter(part => {
      if (part.name.toLowerCase().includes(lowerSearch)) return true;
      const chaptersInPart = files.filter(f => f.parentId === part.id && f.type === 'chapter' && f.name !== 'Table Of Contents');
      return chaptersInPart.some(c => c.name.toLowerCase().includes(lowerSearch));
    });
  };

  const getFilteredChaptersInPart = (partId: string) => {
    const chapters = files
      .filter(f => f.parentId === partId && f.type === 'chapter' && f.name !== 'Table Of Contents')
      .sort((a, b) => a.order - b.order);
      
    if (!manuscriptSearch) return chapters;
    
    const lowerSearch = manuscriptSearch.toLowerCase();
    const partMatch = parts.find(p => p.id === partId)?.name.toLowerCase().includes(lowerSearch);
    
    if (partMatch) return chapters;
    return chapters.filter(c => c.name.toLowerCase().includes(lowerSearch));
  };

  const filteredParts = getFilteredPartsList();

  return (
    <>
      <div className="p-4 border-b border-zinc-200 dark:border-[#27272a] flex items-center gap-2">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 2048 2048" 
          className="h-7 w-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          <path d="M 1108.57 393.151 C 1223.45 337.907 1348.12 310.902 1473.83 334.617 C 1489.84 337.637 1509.8 339.934 1525.11 343.931 C 1390.6 405.215 1287.98 560.697 1225.7 689.329 C 1165.63 705.785 1100.57 720.881 1039.86 735.511 L 1041.88 737.492 C 1084.09 731.99 1127.12 728.659 1169.49 724.114 C 1182.6 722.707 1196.29 721.539 1209.44 720.816 C 1185.37 780.537 1149.23 843.255 1094.74 879.908 C 1034.17 920.64 964.107 904.05 900.793 942.431 C 844.032 976.839 819.958 1020.21 803.077 1081.58 C 785.578 1081.2 779.184 1079.82 762.404 1074.07 C 766.697 1055.32 778.758 1025.72 786.018 1006.88 C 824.475 907.072 883.447 813.057 949.632 729.369 C 963.418 711.936 982.997 691.323 998.288 674.911 C 1040.31 629.098 1085.31 586.114 1133 546.24 C 1159.42 524.031 1187.43 499.254 1216.03 480 L 1214.79 477.863 C 1166.51 511.188 1116.88 543.66 1071.45 581.106 C 932.537 695.605 807.043 851.151 747.866 1022.95 C 671.1 811.672 817.412 586.248 983.369 465.531 C 1008.01 447.61 1041.02 424.077 1069 412.104 L 1044.93 496.245 C 1038.55 518.314 1031.07 542.179 1025.93 564.46 L 1027.55 566.285 C 1048.63 517.156 1073.5 468.76 1095.39 419.902 C 1099.23 411.312 1104.02 401.354 1108.57 393.151 z" fill="rgb(110,92,216)"></path>
          <path d="M 1214.79 477.863 C 1216.94 476.185 1230.78 466.573 1233.05 466.641 L 1233.22 466.746 C 1233.2 468.611 1218.54 478.22 1216.03 480 L 1214.79 477.863 z" fill="rgb(195,185,238)"></path>
          <path d="M 1041.88 737.492 C 1040.37 737.849 1032.52 738.852 1031.89 737.5 C 1033.11 736.093 1038.12 735.755 1039.86 735.511 L 1041.88 737.492 z" fill="rgb(195,185,238)"></path>
          <path d="M 1025.93 564.46 L 1027.55 566.285 C 1027.23 567.107 1025.55 572.546 1024.39 572.466 C 1023.21 571.241 1025.47 565.748 1025.93 564.46 z" fill="rgb(195,185,238)"></path>
          <path d="M 952.724 995.241 L 1046.95 995.065 C 1063.09 995.057 1078.83 994.619 1095.2 995.746 C 1109.97 996.763 1113.94 1013.63 1105.38 1023.85 C 1101.25 1028.77 1089.47 1028.14 1083.34 1028.18 C 1083.03 1038.09 1083.1 1048.29 1084.24 1058.14 C 1093.26 1070.35 1100.32 1071.27 1113.51 1076.82 C 1184.95 1106.86 1152.57 1233.84 1091.72 1256.53 C 1088.2 1257.26 1084.64 1257.71 1081.05 1257.86 C 1047.18 1259.05 1012.53 1257.48 978.603 1258.2 C 959.338 1258.6 944.295 1257.9 929.618 1243.4 C 891.181 1205.44 863.902 1108.82 925.331 1078.61 C 934.418 1074.16 947.925 1074.28 955.537 1065.41 C 964.576 1054.89 963.293 1042.24 962.744 1029.47 L 951.753 1028.69 C 935.954 1018.35 933.696 1003.09 952.724 995.241 z" fill="currentColor"></path>
          <path d="M 914.321 1157.85 C 907.774 1137.41 909.889 1114.3 929.122 1101.23 C 949.676 1087.27 974.066 1089.67 997.199 1094.22 C 964.079 1098.23 922.565 1101.15 916.845 1143.94 C 917.173 1150.48 916.816 1156.33 917.204 1162.94 L 915.932 1164.28 C 915.4 1162.11 914.818 1160.03 914.321 1157.85 z" fill="rgb(255,255,255)"></path>
          <path d="M 916.845 1143.94 C 917.173 1150.48 916.816 1156.33 917.204 1162.94 L 915.932 1164.28 C 915.4 1162.11 914.818 1160.03 914.321 1157.85 C 916.996 1156.7 916.065 1148 916.845 1143.94 z" fill="rgb(156,157,162)"></path>
          <path d="M 917.204 1162.94 C 917.691 1164.39 918.267 1165.74 917.782 1167.26 L 917.587 1167.36 C 916.919 1167 916.23 1164.92 915.932 1164.28 L 917.204 1162.94 z" fill="rgb(63,64,68)"></path>
          <path d="M 939.077 1398.96 L 991.697 1398.91 C 1002.37 1449.82 1012.67 1506.1 1025.28 1556.11 C 1030.42 1540.12 1036.16 1510.23 1040.03 1493.1 C 1047.32 1461.65 1054.86 1430.26 1062.63 1398.92 L 1115.44 1398.95 C 1127.67 1451.2 1140.22 1503.38 1153.1 1555.48 C 1165.03 1507.17 1174.94 1448.63 1184.56 1399.06 C 1201.74 1398.92 1218.92 1398.9 1236.11 1399 C 1233.39 1408.37 1230.75 1417.77 1228.2 1427.19 C 1212.42 1485.84 1194.91 1548.49 1181.09 1607.4 L 1122.9 1607.25 C 1117.48 1589.27 1112.12 1563.02 1107.77 1544.49 C 1101.44 1518.24 1094.82 1492.06 1087.91 1465.95 L 1052.75 1607.23 L 994.335 1607.47 C 987.549 1583.6 982.012 1559.94 975.642 1536.03 C 963.118 1490.43 950.929 1444.74 939.077 1398.96 z" fill="currentColor"></path>
          <path d="M 1334.69 1397.34 C 1377.65 1392.77 1416.61 1408.34 1435.52 1449.18 C 1445.18 1470.05 1445.59 1492.65 1443.86 1515.2 C 1396.26 1515.22 1348.7 1516.19 1301.1 1515.76 C 1303.98 1543.93 1317.79 1564.9 1349.48 1563.83 C 1368.04 1563.2 1379.82 1554.28 1388.42 1538.19 C 1400.38 1538.03 1412.77 1538.22 1424.77 1538.24 L 1440.45 1538.65 C 1436.41 1551.72 1432.93 1559.74 1425.08 1571.23 C 1396.24 1613.62 1331.84 1620.31 1291.13 1591.74 C 1237.97 1554.42 1236.44 1450.94 1290.3 1413.79 C 1304.17 1404.22 1318 1399.63 1334.69 1397.34 z" fill="currentColor"></path>
          <path d="M 1341.97 1439.3 C 1367.73 1437.44 1391.07 1453.22 1393.12 1480.02 C 1393.47 1484.56 1382.02 1482.43 1378.43 1482.5 C 1370.98 1482.65 1362.99 1482.37 1355.5 1482.33 L 1301.29 1482.22 C 1307.49 1457.27 1314.61 1443.82 1341.97 1439.3 z" fill="rgb(255,255,255)"></path>
          <path d="M 752.252 1329.21 L 800.407 1329.93 L 801.089 1481.35 C 823.844 1455.01 844.402 1425.61 867.02 1399.08 C 886.676 1398.83 906.333 1398.8 925.99 1398.97 C 901.744 1432.16 867.775 1466.04 844.53 1498.79 C 859.235 1520.29 881.168 1545.88 897.941 1566.66 C 908.873 1580.14 919.586 1593.8 930.076 1607.63 C 911.313 1606.71 889.327 1607.27 870.328 1607.3 C 851.49 1580.08 821.979 1540.88 800.981 1515.59 C 800.595 1545.92 800.819 1576.74 800.762 1607.1 L 752.434 1607.03 L 752.252 1329.21 z" fill="currentColor"></path>
          <path d="M 621.732 1396.41 C 659.938 1394.4 693.252 1412.91 701.616 1451.96 C 706.382 1474.21 704.749 1497.94 704.774 1520.68 L 704.871 1606.97 L 656.108 1607.03 L 655.679 1523.5 C 655.574 1508.22 655.377 1493.3 654.87 1478.03 C 653.709 1443.01 616.857 1428.4 587.941 1443.7 C 563.982 1460.99 569.274 1496.4 569.232 1523.17 L 569.26 1607.02 L 519.573 1606.99 C 520.496 1538.05 519.896 1467.98 519.858 1399 L 569 1399.05 C 569.036 1407.44 569.206 1415.82 569.51 1424.2 C 570.666 1422.72 571.85 1421.27 573.061 1419.85 C 586.218 1404.4 602 1398.06 621.732 1396.41 z" fill="currentColor"></path>
          <path d="M 416.053 1343.04 L 470.014 1342.98 L 469.839 1607.08 L 416.056 1607.14 L 416.053 1343.04 z" fill="currentColor"></path>
          <path d="M 1582.69 1329.48 C 1598.49 1329.91 1615.13 1329.76 1630.99 1329.86 L 1631.05 1607.36 L 1582.16 1607.41 C 1581.36 1547.08 1582.12 1485.28 1582.19 1424.89 L 1582.13 1364.51 C 1582.12 1354.43 1581.69 1339.15 1582.69 1329.48 z" fill="currentColor"></path>
          <path d="M 1482.95 1329.83 L 1531.95 1329.89 L 1532 1606.88 C 1515.85 1607.1 1499.3 1606.92 1483.11 1606.93 L 1482.95 1329.83 z" fill="currentColor"></path>
          <path d="M 756.373 1094.98 C 768.39 1106.62 779.986 1108.92 795.797 1109.16 C 792.143 1129.44 786.767 1149.56 782.197 1169.96 C 773.324 1209.55 766.744 1256.32 713.936 1253.94 C 698.333 1253.24 688.405 1249.19 676.353 1238.95 C 673.37 1235.94 670.655 1232.68 668.239 1229.19 C 655.863 1211.47 658.045 1193.36 661.58 1173.69 C 675.254 1176.25 689.447 1178.01 703.243 1179.77 C 701.67 1187.19 699.644 1195.33 702.618 1202.71 C 707.477 1214.72 724.691 1213.48 728.959 1201.93 C 733.632 1189.29 736.379 1174.27 739.433 1161.11 C 744.405 1138.9 750.054 1116.84 756.373 1094.98 z" fill="rgb(110,92,216)"></path>
        </svg>
        <span className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Inkwell</span>
      </div>
      {/* File Tree Area */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="mb-4">
          <div 
            className="flex items-center gap-2 py-1 text-sm cursor-pointer group hover:text-zinc-900 dark:text-zinc-100 text-zinc-700 dark:text-zinc-300 transition-colors"
            onClick={() => setIsTocExpanded(!isTocExpanded)}
          >
            <motion.div animate={{ rotate: isTocExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.div>
            <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400">{t(language, 'tableOfContents')}</span>
          </div>
          <AnimatePresence>
            {isTocExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="ml-1 pl-3 border-l border-zinc-300 dark:border-zinc-800 space-y-0.5 overflow-hidden mt-1"
              >
                {parts.map(part => (
                  <div key={'toc-'+part.id} className="mb-2 text-xs">
                     <span className="font-bold text-zinc-600 dark:text-zinc-400">{part.name}</span>
                     <div className="ml-2 border-l border-zinc-300 dark:border-zinc-800 pl-2 mt-1 space-y-1">
                        {files.filter(f => f.parentId === part.id && f.type === 'chapter' && f.name !== 'Table Of Contents').sort((a,b)=>a.order-b.order).map(c => (
                           <div key={'toc-'+c.id} className="text-zinc-500 truncate" title={c.name}>{c.name}</div>
                        ))}
                     </div>
                  </div>
                ))}
                {files.filter(f => !f.parentId && f.type === 'chapter' && f.name !== 'Table Of Contents').sort((a,b)=>a.order-b.order).length > 0 && (
                  <div className="mb-2 text-xs">
                    <span className="font-bold text-zinc-600 dark:text-zinc-400">Other Chapters</span>
                    <div className="ml-2 border-l border-zinc-300 dark:border-zinc-800 pl-2 mt-1 space-y-1">
                      {files.filter(f => !f.parentId && f.type === 'chapter' && f.name !== 'Table Of Contents').sort((a,b)=>a.order-b.order).map(c => (
                        <div key={'toc-'+c.id} className="text-zinc-500 truncate" title={c.name}>{c.name}</div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between mb-2 mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{t(language, 'manuscript')}</h2>
          {user && (
            <button 
              onClick={saveToFirebase}
              className="p-1 hover:bg-zinc-200 dark:bg-zinc-800 rounded transition-colors text-indigo-400"
              title="Save to Cloud"
            >
              <Save className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        
        <div className="relative mb-4">
          <Search className="w-3.5 h-3.5 absolute left-2 top-1.5 text-zinc-500" />
          <input 
            type="text" 
            placeholder={t(language, 'searchChapters')}
            value={manuscriptSearch}
            onChange={(e) => setManuscriptSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded pb-1 pt-1.5 pl-7 pr-2 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-300 dark:border-zinc-700"
          />
        </div>

        <div className="space-y-1">
          {filteredParts.map(part => (
            <div key={part.id} className="mb-4">
              <div 
                draggable
                onDragStart={(e) => {
                  setDraggedFileId(part.id);
                  e.dataTransfer.setData('text/plain', part.id); // Required for Firefox
                }}
                onDragEnd={() => setDraggedFileId(null)}
                className={cn(
                  "flex items-center gap-2 py-1 text-sm cursor-pointer group",
                  activeFileId === part.id ? "text-indigo-400 font-medium" : "text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:text-zinc-100"
                )}
                onClick={() => togglePart(part.id)}
              >
                <motion.div
                  animate={{ rotate: expandedParts[part.id] || manuscriptSearch ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </motion.div>
                <span className="flex-1">{part.name}</span>
              </div>

              <AnimatePresence>
                {(expandedParts[part.id] || manuscriptSearch) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="ml-1 pl-3 border-l border-zinc-300 dark:border-zinc-800 space-y-0.5 overflow-hidden mt-1"
                  >
                    {getFilteredChaptersInPart(part.id).map(chapter => (
                        <div
                          key={chapter.id}
                          draggable
                          onDragStart={(e) => {
                            setDraggedFileId(chapter.id);
                            e.dataTransfer.setData('text/plain', chapter.id);
                          }}
                          onDragEnd={() => setDraggedFileId(null)}
                          className={cn(
                            "flex items-center gap-2 pl-3 py-1 cursor-pointer group text-sm",
                            activeFileId === chapter.id 
                              ? "text-indigo-400 bg-indigo-500/10 border-r-2 border-indigo-500" 
                              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-300"
                          )}
                          onClick={() => setActiveFileId(chapter.id)}
                        >
                          <span className="truncate flex-1">{chapter.name}</span>
                        </div>
                      ))}
                    <button
                      onClick={() => addChapter(part.id)}
                      className="flex items-center gap-2 pl-3 py-1 w-full text-left text-xs text-zinc-600 hover:text-zinc-600 dark:text-zinc-400 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add Chapter
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {/* Root Level Chapters */}
          {files
            .filter(f => !f.parentId && f.type === 'chapter')
            .filter(f => !manuscriptSearch || f.name.toLowerCase().includes(manuscriptSearch.toLowerCase()))
            .map(chapter => (
              <div
                key={chapter.id}
                draggable
                onDragStart={(e) => {
                  setDraggedFileId(chapter.id);
                  e.dataTransfer.setData('text/plain', chapter.id);
                }}
                onDragEnd={() => setDraggedFileId(null)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1 cursor-pointer group text-sm rounded",
                  activeFileId === chapter.id 
                    ? "text-indigo-400 bg-indigo-500/10 border-r-2 border-indigo-500" 
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-300"
                )}
                onClick={() => setActiveFileId(chapter.id)}
              >
                <span className="flex-1 truncate pl-1">{chapter.name}</span>
              </div>
            ))}

          {/* Snippets Section */}
          <div className="mt-8 mb-4 px-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Snippet Library</h2>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setShowSnippetSearch(!showSnippetSearch)}
                  className="p-1 hover:bg-zinc-200 dark:bg-zinc-800 rounded transition-colors"
                >
                  <Search className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showSnippetSearch && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-2"
                >
                  <input 
                    type="text"
                    placeholder="Filter snippets..."
                    value={snippetSearch}
                    onChange={(e) => setSnippetSearch(e.target.value)}
                    className="w-full text-xs bg-zinc-200 dark:bg-zinc-800 border-none rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-800 dark:text-zinc-200"
                    autoFocus
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1 mt-2">
              {snippets.length === 0 ? (
                <p className="text-[10px] text-zinc-500 italic pl-1">No snippets saved yet.</p>
              ) : (
                snippets
                  .filter(s => s.name.toLowerCase().includes(snippetSearch.toLowerCase()))
                  .map(snippet => (
                    <div 
                      key={snippet.id} 
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', snippet.content)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded cursor-grab active:cursor-grabbing hover:bg-zinc-200 dark:bg-zinc-800 transition-colors group"
                    >
                      <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate flex-1">{snippet.name}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeFileId) updateFileContent(activeFileId, (files.find(f => f.id === activeFileId)?.content || '') + "\n\n" + snippet.content);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-indigo-400 transition-opacity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Glossary Section */}
          <div className="mt-8 mb-4 px-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{t(language, 'glossary')}</h2>
              <button 
                onClick={() => {
                  const term = prompt(t(language, 'enterTerm'));
                  if (term) {
                    const def = prompt(t(language, 'enterDef', { term }));
                    if (def) {
                      addGlossaryTerm(term, def);
                    }
                  }
                }}
                className="p-1 hover:bg-zinc-200 dark:bg-zinc-800 rounded transition-colors"
                title="Add New Term"
              >
                <Plus className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
              </button>
            </div>

            <div className="space-y-1 mt-2">
              {glossaryTerms.length === 0 ? (
                <p className="text-[10px] text-zinc-500 italic pl-1">{t(language, 'noTerms')}</p>
              ) : (
                glossaryTerms.map(term => (
                  <div 
                    key={term.id} 
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', term.term)}
                    className="flex flex-col px-2 py-1.5 rounded cursor-grab active:cursor-grabbing hover:bg-zinc-200 dark:bg-zinc-800 transition-colors group relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-800 dark:text-zinc-200 font-bold truncate flex-1">{term.term}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteGlossaryTerm(term.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity text-zinc-500"
                        title="Delete term"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-tight mt-1">{term.definition}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 px-2">{t(language, 'assetsAndFonts')}</h2>
            
            {/* Assets Grid */}
            <div className="grid grid-cols-2 gap-2 px-1 relative mb-4">
              {assets.map(asset => (
                <div 
                  key={asset.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('asset-url', asset.url);
                    e.dataTransfer.setData('asset-caption', asset.caption || '');
                    e.dataTransfer.setData('text/plain', `![${asset.caption || asset.name}](${asset.url})`);
                  }}
                  className="aspect-square bg-zinc-200 dark:bg-zinc-800 rounded overflow-hidden border border-zinc-200 dark:border-[#27272a] cursor-grab active:cursor-grabbing group relative"
                >
                  <img 
                    src={asset.url} 
                    alt={asset.name} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Error';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[8px] text-white font-bold uppercase truncate px-1 text-center">{asset.name}</span>
                  </div>
                </div>
              ))}
              
              <label className="aspect-square rounded border border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-200 dark:bg-zinc-800 transition-colors">
                <Plus className="w-4 h-4 text-zinc-500" />
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileSelect} 
                />
              </label>
            </div>

            {/* Fonts List */}
            <div className="px-1 space-y-2">
              {customFonts.map(font => (
                <div 
                  key={font.id}
                  className="bg-zinc-200 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-800 rounded p-2 flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter truncate">
                      {font.name.split('_').join(' ')}
                    </p>
                    <p 
                      className="text-sm text-zinc-800 dark:text-zinc-200 truncate"
                      style={{ fontFamily: font.name }}
                    >
                      Sample Text
                    </p>
                  </div>
                  <Type className="w-3.5 h-3.5 text-zinc-600 group-hover:text-pink-400 transition-colors" />
                </div>
              ))}
            </div>

            {/* Upload Preview Overlay */}
            <AnimatePresence>
              {uploadPreview && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-x-0 bottom-40 z-20 bg-white dark:bg-[#1e1e20] border border-zinc-300 dark:border-zinc-700 rounded-lg p-3 shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">Prepare Asset</span>
                    <button onClick={() => setUploadPreview(null)} className="text-zinc-500 hover:text-black dark:hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div className="aspect-video bg-black rounded overflow-hidden mb-3">
                    <img src={uploadPreview} className="w-full h-full object-contain" />
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 uppercase font-bold">Asset Name</label>
                      <input 
                        type="text" 
                        value={uploadName}
                        onChange={(e) => setUploadName(e.target.value)}
                        placeholder="Image name..."
                        className="w-full bg-zinc-100 dark:bg-zinc-900 border-none px-2 py-1.5 text-xs text-white rounded outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <button 
                      onClick={confirmUpload}
                      disabled={isUploading}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-300 dark:bg-zinc-700 text-white text-xs font-bold py-2 rounded mt-2 flex items-center justify-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3" />
                          Add to Assets
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Action Buttons & User Area */}
      <div className="h-[153px] p-3 border-t border-zinc-200 dark:border-[#27272a] bg-zinc-100 dark:bg-[#1a1a1c] flex flex-col gap-2 shrink-0">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => addChapter(null)}
            className="flex-1 py-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium rounded transition-colors"
          >
            + New Chapter
          </button>
          <button
            onClick={addPart}
            className="flex-1 py-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium rounded transition-colors"
          >
            + New Part
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-300 dark:border-zinc-800/50 mt-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center text-indigo-200 overflow-hidden">
              {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <User className="w-4 h-4" />}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[80px]">{user ? user.displayName : 'Guest'}</span>
              <span className="text-[10px] text-zinc-500">{user ? 'PRO Plan' : 'Local'}</span>
            </div>
          </div>
          
          <div className="flex gap-1">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 hover:bg-zinc-300 dark:bg-zinc-700 rounded transition-colors text-zinc-600 dark:text-zinc-400"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button className="p-1.5 hover:bg-zinc-300 dark:bg-zinc-700 rounded transition-colors text-zinc-600 dark:text-zinc-400">
              <Settings className="w-4 h-4" />
            </button>
            {user ? (
              <button 
                onClick={logout}
                className="p-1.5 hover:bg-zinc-300 dark:bg-zinc-700 rounded transition-colors text-red-400"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={login}
                className="p-1.5 hover:bg-zinc-300 dark:bg-zinc-700 rounded transition-colors text-indigo-400"
                title="Login"
              >
                <LogIn className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
