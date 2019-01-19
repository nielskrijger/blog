module.exports = collection => {
  const tagSet = new Set();
  collection.getAll().forEach(item => {
    if ('tags' in item.data) {
      const tags = item.data.tags.filter(item => {
        switch (item) {
          // this list should match the `filter` list in tags.njk
          case 'all':
          case 'nav':
          case 'post':
          case 'posts':
            return false;
        }

        return true;
      });

      for (const tag of tags) {
        tagSet.add(tag);
      }
    }
  });

  const result = Array.from(tagSet);
  result.sort(); // Sort alphabetically
  return result;
};
