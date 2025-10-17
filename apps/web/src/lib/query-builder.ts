/**
 * QueryBuilder - Advanced search query parser with boolean operators
 *
 * Supports:
 * - Boolean operators: AND, OR, NOT
 * - Parentheses grouping: (term1 AND term2) OR term3
 * - Field-specific search: title:anatomy, course:physiology, date:2024-01-01..2024-12-31
 * - Case-insensitive matching
 *
 * Limitations:
 * - Max 5 boolean operators per query
 * - Max 3 nesting levels
 */

export interface ParsedQuery {
  original: string;
  tokens: Token[];
  ast: QueryNode | null;
  errors: string[];
  metadata: {
    operatorCount: number;
    nestingDepth: number;
    hasFieldFilters: boolean;
  };
}

export interface Token {
  type: 'TERM' | 'AND' | 'OR' | 'NOT' | 'LPAREN' | 'RPAREN' | 'FIELD' | 'EOF';
  value: string;
  position: number;
}

export type QueryNode =
  | { type: 'TERM'; value: string; field?: string }
  | { type: 'FIELD_QUERY'; field: string; value: string }
  | { type: 'DATE_RANGE'; field: string; start: string; end: string }
  | { type: 'AND'; left: QueryNode; right: QueryNode }
  | { type: 'OR'; left: QueryNode; right: QueryNode }
  | { type: 'NOT'; operand: QueryNode };

export interface SemanticQuery {
  embeddingText: string;
  weight: number;
}

export interface FilterQuery {
  AND?: FilterQuery[];
  OR?: FilterQuery[];
  NOT?: FilterQuery[];
  title?: { contains: string; mode?: 'insensitive' };
  courseName?: { contains: string; mode?: 'insensitive' };
  uploadedAt?: { gte?: Date; lte?: Date };
  metadata?: { path?: string[]; equals?: string; string_contains?: string };
}

const VALID_FIELDS = ['title', 'course', 'date', 'author'];
const MAX_OPERATORS = 5;
const MAX_NESTING_DEPTH = 3;

export class QueryBuilder {
  /**
   * Parse a raw query string into a structured ParsedQuery object
   */
  parseQuery(query: string): ParsedQuery {
    const errors: string[] = [];
    const tokens = this.tokenize(query);

    // Validate operator count
    const operatorCount = tokens.filter(t =>
      ['AND', 'OR', 'NOT'].includes(t.type)
    ).length;

    if (operatorCount > MAX_OPERATORS) {
      errors.push(
        `Too many operators: ${operatorCount}. Maximum is ${MAX_OPERATORS}.`
      );
    }

    // Parse AST
    let ast: QueryNode | null = null;
    let nestingDepth = 0;

    try {
      const parser = new QueryParser(tokens);
      ast = parser.parse();
      nestingDepth = this.calculateNestingDepth(ast);

      if (nestingDepth > MAX_NESTING_DEPTH) {
        errors.push(
          `Too much nesting: ${nestingDepth} levels. Maximum is ${MAX_NESTING_DEPTH}.`
        );
      }
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : 'Invalid query syntax'
      );
    }

    const hasFieldFilters = tokens.some(t => t.type === 'FIELD');

    return {
      original: query,
      tokens,
      ast,
      errors,
      metadata: {
        operatorCount,
        nestingDepth,
        hasFieldFilters,
      },
    };
  }

  /**
   * Tokenize the query string
   */
  private tokenize(query: string): Token[] {
    const tokens: Token[] = [];
    let position = 0;
    let i = 0;

    const trimmed = query.trim();

    while (i < trimmed.length) {
      // Skip whitespace
      if (/\s/.test(trimmed[i])) {
        i++;
        continue;
      }

      // Check for parentheses
      if (trimmed[i] === '(') {
        tokens.push({ type: 'LPAREN', value: '(', position: i });
        i++;
        continue;
      }

      if (trimmed[i] === ')') {
        tokens.push({ type: 'RPAREN', value: ')', position: i });
        i++;
        continue;
      }

      // Check for field-specific query (field:value or field:start..end)
      const fieldMatch = trimmed.slice(i).match(/^(\w+):([^\s()]+)/);
      if (fieldMatch) {
        const field = fieldMatch[1].toLowerCase();
        const value = fieldMatch[2];

        if (!VALID_FIELDS.includes(field)) {
          throw new Error(
            `Invalid field "${field}". Valid fields are: ${VALID_FIELDS.join(', ')}`
          );
        }

        // Check for date range
        if (field === 'date' && value.includes('..')) {
          const [start, end] = value.split('..');
          tokens.push({
            type: 'FIELD',
            value: JSON.stringify({ field, type: 'range', start, end }),
            position: i,
          });
        } else {
          tokens.push({
            type: 'FIELD',
            value: JSON.stringify({ field, value }),
            position: i,
          });
        }

        i += fieldMatch[0].length;
        continue;
      }

      // Check for boolean operators (case-insensitive)
      const upperRemaining = trimmed.slice(i).toUpperCase();

      if (upperRemaining.startsWith('AND') && (i + 3 >= trimmed.length || /\s/.test(trimmed[i + 3]))) {
        tokens.push({ type: 'AND', value: 'AND', position: i });
        i += 3;
        continue;
      }

      if (upperRemaining.startsWith('OR') && (i + 2 >= trimmed.length || /\s/.test(trimmed[i + 2]))) {
        tokens.push({ type: 'OR', value: 'OR', position: i });
        i += 2;
        continue;
      }

      if (upperRemaining.startsWith('NOT') && (i + 3 >= trimmed.length || /\s/.test(trimmed[i + 3]))) {
        tokens.push({ type: 'NOT', value: 'NOT', position: i });
        i += 3;
        continue;
      }

      // Extract term (word or quoted phrase)
      let term = '';

      // Handle quoted strings
      if (trimmed[i] === '"') {
        i++; // Skip opening quote
        while (i < trimmed.length && trimmed[i] !== '"') {
          term += trimmed[i];
          i++;
        }
        if (i < trimmed.length) i++; // Skip closing quote
      } else {
        // Regular term
        while (i < trimmed.length && !/[\s()]/.test(trimmed[i])) {
          term += trimmed[i];
          i++;
        }
      }

      if (term) {
        tokens.push({ type: 'TERM', value: term, position: position });
      }
    }

    tokens.push({ type: 'EOF', value: '', position: trimmed.length });
    return tokens;
  }

  /**
   * Calculate maximum nesting depth of query AST
   */
  private calculateNestingDepth(node: QueryNode | null): number {
    if (!node) return 0;

    if (node.type === 'TERM' || node.type === 'FIELD_QUERY' || node.type === 'DATE_RANGE') {
      return 1;
    }

    if (node.type === 'NOT') {
      return 1 + this.calculateNestingDepth(node.operand);
    }

    if (node.type === 'AND' || node.type === 'OR') {
      return 1 + Math.max(
        this.calculateNestingDepth(node.left),
        this.calculateNestingDepth(node.right)
      );
    }

    return 0;
  }

  /**
   * Build semantic search query from parsed query
   * Extracts plain text terms for embedding generation
   */
  buildSemanticQuery(parsed: ParsedQuery): SemanticQuery {
    if (!parsed.ast) {
      return { embeddingText: parsed.original, weight: 1.0 };
    }

    const terms = this.extractTerms(parsed.ast);
    const embeddingText = terms.join(' ');

    // Weight adjustment based on query complexity
    // Simple queries get higher semantic weight
    const weight = parsed.metadata.hasFieldFilters ? 0.5 : 0.7;

    return { embeddingText, weight };
  }

  /**
   * Extract all search terms from AST
   */
  private extractTerms(node: QueryNode): string[] {
    if (node.type === 'TERM') {
      return [node.value];
    }

    if (node.type === 'FIELD_QUERY') {
      return [node.value];
    }

    if (node.type === 'DATE_RANGE') {
      return [];
    }

    if (node.type === 'NOT') {
      return this.extractTerms(node.operand);
    }

    if (node.type === 'AND' || node.type === 'OR') {
      return [
        ...this.extractTerms(node.left),
        ...this.extractTerms(node.right),
      ];
    }

    return [];
  }

  /**
   * Build Prisma filter query from parsed query
   */
  buildFilterQuery(parsed: ParsedQuery): FilterQuery {
    if (!parsed.ast) {
      return {};
    }

    return this.buildFilterFromNode(parsed.ast);
  }

  /**
   * Recursively build Prisma filters from AST nodes
   */
  private buildFilterFromNode(node: QueryNode): FilterQuery {
    if (node.type === 'TERM') {
      // Simple term - search across all text fields
      return {
        OR: [
          { title: { contains: node.value, mode: 'insensitive' } },
        ],
      };
    }

    if (node.type === 'FIELD_QUERY') {
      // Field-specific query
      if (node.field === 'title') {
        return { title: { contains: node.value, mode: 'insensitive' } };
      }
      if (node.field === 'course') {
        return { courseName: { contains: node.value, mode: 'insensitive' } };
      }
      if (node.field === 'author') {
        return { metadata: { path: ['author'], equals: node.value } };
      }
      return {};
    }

    if (node.type === 'DATE_RANGE') {
      // Date range query
      const start = new Date(node.start);
      const end = new Date(node.end);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return {};
      }

      return {
        uploadedAt: {
          gte: start,
          lte: end,
        },
      };
    }

    if (node.type === 'AND') {
      return {
        AND: [
          this.buildFilterFromNode(node.left),
          this.buildFilterFromNode(node.right),
        ],
      };
    }

    if (node.type === 'OR') {
      return {
        OR: [
          this.buildFilterFromNode(node.left),
          this.buildFilterFromNode(node.right),
        ],
      };
    }

    if (node.type === 'NOT') {
      return {
        NOT: [this.buildFilterFromNode(node.operand)],
      };
    }

    return {};
  }
}

/**
 * Recursive descent parser for boolean query syntax
 */
class QueryParser {
  private tokens: Token[];
  private current: number;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.current = 0;
  }

  parse(): QueryNode | null {
    if (this.peek().type === 'EOF') {
      return null;
    }
    return this.parseOrExpression();
  }

  private parseOrExpression(): QueryNode {
    let left = this.parseAndExpression();

    while (this.peek().type === 'OR') {
      this.advance(); // consume OR
      const right = this.parseAndExpression();
      left = { type: 'OR', left, right };
    }

    return left;
  }

  private parseAndExpression(): QueryNode {
    let left = this.parseNotExpression();

    while (this.peek().type === 'AND') {
      this.advance(); // consume AND
      const right = this.parseNotExpression();
      left = { type: 'AND', left, right };
    }

    return left;
  }

  private parseNotExpression(): QueryNode {
    if (this.peek().type === 'NOT') {
      this.advance(); // consume NOT
      const operand = this.parsePrimary();
      return { type: 'NOT', operand };
    }

    return this.parsePrimary();
  }

  private parsePrimary(): QueryNode {
    const token = this.peek();

    if (token.type === 'LPAREN') {
      this.advance(); // consume (
      const expr = this.parseOrExpression();
      if (this.peek().type !== 'RPAREN') {
        throw new Error(`Expected closing parenthesis, got ${this.peek().type}`);
      }
      this.advance(); // consume )
      return expr;
    }

    if (token.type === 'FIELD') {
      this.advance();
      const parsed = JSON.parse(token.value);

      if (parsed.type === 'range') {
        return {
          type: 'DATE_RANGE',
          field: parsed.field,
          start: parsed.start,
          end: parsed.end,
        };
      }

      return {
        type: 'FIELD_QUERY',
        field: parsed.field,
        value: parsed.value,
      };
    }

    if (token.type === 'TERM') {
      this.advance();
      return { type: 'TERM', value: token.value };
    }

    throw new Error(`Unexpected token: ${token.type} at position ${token.position}`);
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private advance(): Token {
    const token = this.tokens[this.current];
    this.current++;
    return token;
  }
}
