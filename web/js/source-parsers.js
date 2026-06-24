(function () {
  function cloneCsvPreview(file) {
    return {
      name: file.name,
      stem: file.stem || file.name.replace(/\.csv$/i, ""),
      size: file.size,
      columns: [...file.columns],
    };
  }

  async function readCsvFile(file) {
    const text = await readFilePrefix(file, 64 * 1024);
    return {
      name: file.name,
      stem: file.name.replace(/\.csv$/i, ""),
      size: file.size,
      columns: parseCsvHeader(text),
      sourceFile: file,
    };
  }

  function readFilePrefix(file, bytes) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsText(file.slice(0, bytes));
    });
  }

  function parseCsvHeader(text) {
    const firstLine = text.split(/\r?\n/)[0] || "";
    const columns = [];
    let current = "";
    let quoted = false;
    for (let index = 0; index < firstLine.length; index += 1) {
      const char = firstLine[index];
      if (char === '"' && firstLine[index + 1] === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === "," && !quoted) {
        columns.push(cleanColumn(current));
        current = "";
      } else {
        current += char;
      }
    }
    columns.push(cleanColumn(current));
    return columns.filter(Boolean);
  }

  function cleanColumn(value) {
    return value.replace(/^\uFEFF/, "").trim();
  }

  function parseDbml(text) {
    const clean = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    const tables = [];
    const relationships = [];
    const errorParts = [];
    const braceDepth = dbmlBraceDepth(clean);
    if (text.trim() && braceDepth !== 0) {
      errorParts.push("DBML has unbalanced table braces.");
    }
    const tableRegex = /\bTable\s+([A-Za-z_][\w]*)\s*\{/gi;
    let match;
    while ((match = tableRegex.exec(clean))) {
      const tableName = match[1];
      const start = match.index + match[0].length;
      const end = findBlockEnd(clean, start);
      const body = clean.slice(start, end);
      const table = parseTable(tableName, body, relationships);
      tables.push(table);
      tableRegex.lastIndex = end + 1;
    }

    const refRegex =
      /^\s*Ref\s*:\s*([A-Za-z_][\w]*)\.([A-Za-z_][\w]*)\s*>\s*([A-Za-z_][\w]*)\.([A-Za-z_][\w]*)/gim;
    while ((match = refRegex.exec(clean))) {
      const rel = {
        childTable: match[1],
        childColumn: match[2],
        parentTable: match[3],
        parentColumn: match[4],
      };
      pushRelationship(relationships, rel);
      const table = tables.find((item) => item.name === rel.childTable);
      const column = table?.columns.find((item) => item.name === rel.childColumn);
      if (column) {
        column.fk = rel;
      }
    }

    if (text.trim() && !tables.length) {
      errorParts.push("No DBML Table blocks were parsed.");
    }

    return { tables, relationships, error: errorParts.join(" ") };
  }

  function findBlockEnd(text, start) {
    let depth = 1;
    for (let index = start; index < text.length; index += 1) {
      if (text[index] === "{") {
        depth += 1;
      }
      if (text[index] === "}") {
        depth -= 1;
        if (depth === 0) {
          return index;
        }
      }
    }
    return text.length;
  }

  function dbmlBraceDepth(text) {
    let depth = 0;
    for (let index = 0; index < text.length; index += 1) {
      if (text[index] === "{") {
        depth += 1;
      } else if (text[index] === "}") {
        depth -= 1;
      }
    }
    return depth;
  }

  function parseTable(name, body, relationships) {
    const table = { name, columns: [], primaryKey: [] };
    body.split(/\r?\n/).forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line || line.startsWith("indexes") || line === "{" || line === "}") {
        return;
      }

      const compositePk = line.match(/\(([^)]+)\)\s*\[[^\]]*\bpk\b[^\]]*\]/i);
      if (compositePk) {
        compositePk[1]
          .split(",")
          .map((column) => column.trim())
          .filter(Boolean)
          .forEach((column) => {
            if (!table.primaryKey.includes(column)) {
              table.primaryKey.push(column);
            }
          });
        return;
      }

      const columnMatch = line.match(/^([A-Za-z_][\w]*)\s+([A-Za-z_][\w]*(?:\([^)]*\))?)\s*(?:\[(.*?)\])?$/);
      if (!columnMatch) {
        return;
      }
      const column = {
        name: columnMatch[1],
        type: columnMatch[2],
        pk: false,
        notNull: false,
        unique: false,
        fk: null,
      };
      const attrs = columnMatch[3] || "";
      if (/\bpk\b/i.test(attrs)) {
        column.pk = true;
        column.notNull = true;
        table.primaryKey.push(column.name);
      }
      if (/not\s+null/i.test(attrs)) {
        column.notNull = true;
      }
      if (/\bunique\b/i.test(attrs)) {
        column.unique = true;
      }
      const ref = attrs.match(/ref\s*:\s*>\s*([A-Za-z_][\w]*)\.([A-Za-z_][\w]*)/i);
      if (ref) {
        column.fk = {
          childTable: name,
          childColumn: column.name,
          parentTable: ref[1],
          parentColumn: ref[2],
        };
        pushRelationship(relationships, column.fk);
      }
      table.columns.push(column);
    });
    table.primaryKey = [...new Set(table.primaryKey)];
    return table;
  }

  function pushRelationship(relationships, rel) {
    const exists = relationships.some(
      (item) =>
        item.childTable === rel.childTable &&
        item.childColumn === rel.childColumn &&
        item.parentTable === rel.parentTable &&
        item.parentColumn === rel.parentColumn,
    );
    if (!exists) {
      relationships.push(rel);
    }
  }

  window.VSF_SOURCE_PARSERS = {
    cloneCsvPreview,
    parseCsvHeader,
    parseDbml,
    readCsvFile,
  };
}());
