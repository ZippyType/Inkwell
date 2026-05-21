import JSZip from 'jszip';
import { parse } from 'marked';
import { FileSystemItem } from '../types';

function buildHierarchy(files: FileSystemItem[]) {
  const parts = files.filter(f => f.type === 'part').sort((a, b) => a.order - b.order);
  const chapters = files.filter(f => f.type === 'chapter');
  
  const structure: { name: string; type: string; chapters: FileSystemItem[] }[] = [];
  
  parts.forEach(p => {
    structure.push({
      name: p.name,
      type: 'part',
      chapters: chapters.filter(c => c.parentId === p.id).sort((a, b) => a.order - b.order)
    });
  });
  
  const rootChapters = chapters.filter(c => !c.parentId).sort((a, b) => a.order - b.order);
  if (rootChapters.length > 0) {
    structure.push({
      name: 'Root',
      type: 'root',
      chapters: rootChapters
    });
  }
  
  return structure;
}

export async function exportToZip(files: FileSystemItem[]) {
  const zip = new JSZip();
  const structure = buildHierarchy(files);
  
  structure.forEach((part, i) => {
    const partFolder = part.type === 'root' ? zip : zip.folder(`${i + 1}. ${part.name}`);
    if (partFolder) {
      part.chapters.forEach((chapter, j) => {
        const safeName = chapter.name.replace(/[/\\?%*:|"<>]/g, '-');
        partFolder.file(`${j + 1}. ${safeName}.md`, chapter.content || '');
      });
    }
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, 'inkwell-project.zip');
}

export async function exportToEpub(files: FileSystemItem[]) {
  const zip = new JSZip();
  const structure = buildHierarchy(files);

  zip.file('mimetype', 'application/epub+zip');
  
  const metaInf = zip.folder('META-INF');
  metaInf?.file('container.xml', `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

  const oebps = zip.folder('OEBPS');
  if (!oebps) return;
  
  let contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>Inkwell Manuscript</dc:title>
    <dc:language>en</dc:language>
    <dc:identifier id="BookID" opf:scheme="UUID">urn:uuid:12345</dc:identifier>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
`;

  let spine = `  <spine toc="ncx">\n`;
  
  let tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:12345"/>
  </head>
  <docTitle><text>Inkwell Manuscript</text></docTitle>
  <navMap>
`;

  let navPointId = 1;
  let fileIndex = 1;

  for (const part of structure) {
    for (const chapter of part.chapters) {
      const parsedContent = await parse(chapter.content || '');
      
      const safeName = chapter.name.replace(/[/\\?%*:|"<>]/g, '-');
      const filename = `chapter_${fileIndex}.xhtml`;
      const htmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${chapter.name}</title></head>
<body>
<h1>${chapter.name}</h1>
${parsedContent}
</body>
</html>`;
      oebps.file(filename, htmlContent);
      
      contentOpf += `    <item id="chapter_${fileIndex}" href="${filename}" media-type="application/xhtml+xml"/>\n`;
      spine += `    <itemref idref="chapter_${fileIndex}"/>\n`;
      
      tocNcx += `    <navPoint id="navPoint-${navPointId}" playOrder="${navPointId}">
      <navLabel><text>${chapter.name}</text></navLabel>
      <content src="${filename}"/>
    </navPoint>\n`;
      
      navPointId++;
      fileIndex++;
    }
  }

  contentOpf += `  </manifest>\n${spine}  </spine>\n</package>`;
  tocNcx += `  </navMap>\n</ncx>`;

  oebps.file('content.opf', contentOpf);
  oebps.file('toc.ncx', tocNcx);

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, 'inkwell-manuscript.epub');
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
