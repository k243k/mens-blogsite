import { compileMDX } from "next-mdx-remote/rsc";
import GithubSlugger from "github-slugger";
import type { Heading, Root } from "mdast";
import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { visit } from "unist-util-visit";

import { mdxComponents } from "@/components/mdx/components";
import type { TocItem } from "@/server/types/post";

function createTocPlugin(headings: TocItem[]) {
  return () => {
    const slugger = new GithubSlugger();
    return (tree: Root) => {
      visit(tree, "heading", (node) => {
        const heading = node as Heading;
        if (!heading || typeof heading.depth !== "number") return;
        if (heading.depth < 2 || heading.depth > 3) return;

        const title = toString(heading);
        if (!title) return;
        const id = slugger.slug(title);
        const data = (heading.data ??= {});
        (data as Record<string, unknown>).id = id;
        const hProperties = ((data as Record<string, unknown>).hProperties ??= {} as Record<string, unknown>) as Record<string, unknown>;
        hProperties.id = id;
        headings.push({
          id,
          title,
          level: heading.depth,
        });
      });
    };
  };
}

export async function renderMdxContent(source: string) {
  const headings: TocItem[] = [];

  const { content } = await compileMDX({
    source,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm, createTocPlugin(headings)],
        rehypePlugins: [
          [
            rehypeAutolinkHeadings,
            {
              behavior: "append",
              properties: {
                className: "heading-anchor",
              },
            },
          ],
        ],
      },
    },
    components: mdxComponents,
  });

  return { content, headings } as const;
}
