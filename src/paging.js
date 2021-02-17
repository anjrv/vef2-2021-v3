import { select } from './db.js';

async function getPage(req) {
  let { offset = 0, limit = 50 } = req.query;
  offset = Number(offset);
  limit = Number(limit);
  const rows = await select(offset, limit);

  const list = {
    links: {
      self: {
        href: `/?offset=${offset}&limit=${limit}`,
      },
    },
    items: rows,
    os: offset,
    lim: limit,
  };

  if (offset > 0) {
    list.links.prev = {
      href: `/?offset=${offset - limit}&limit=${limit}`,
    };
  }

  if (rows.length <= limit) {
    list.links.next = {
      href: `/?offset=${Number(offset) + limit}&limit=${limit}`,
    };
  }

  return list;
}

export { getPage };
