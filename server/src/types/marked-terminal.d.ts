declare module "marked-terminal" {
  import { MarkedExtension } from "marked";

  interface MarkedTerminalOptions {
    code?: (text: string) => string;
    blockquote?: (text: string) => string;
    heading?: (text: string) => string;
    firstHeading?: (text: string) => string;
    hr?: (text: string) => string;
    listitem?: (text: string) => string;
    list?: (text: string) => string;
    paragraph?: (text: string) => string;
    strong?: (text: string) => string;
    em?: (text: string) => string;
    codespan?: (text: string) => string;
    del?: (text: string) => string;
    link?: (text: string) => string;
    href?: (text: string) => string;
    [key: string]: any;
  }

  export function markedTerminal(
    options?: MarkedTerminalOptions,
  ): MarkedExtension;
}
