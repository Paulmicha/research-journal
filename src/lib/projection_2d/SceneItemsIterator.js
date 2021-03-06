/**
 * Traverses and sorts Collection of Iterable instances.
 */
export default class SceneItemsIterator {
  constructor (collection) {
    this.cursor = 0
    this.collection = collection
  }

  next () {
    if (this.hasMore()) {
      const item = this.collection.items[this.cursor]
      this.cursor++
      return item
    }
  }

  hasMore () {
    const count = this.collection.count()
    return count > 0 && this.cursor < count
  }

  reset () {
    this.cursor = 0
  }

  traverse (callback) {
    while (this.hasMore()) {
      callback(this.next())
    }
    this.reset()
  }

  async traverseAsync (callback) {
    while (this.hasMore()) {
      await callback(this.next())
    }
    this.reset()
  }

  /**
   * TODO Sorts collection items.
   */
  sort () {
    if (this.collection.items.length <= 1) {
      return
    }
    // this.collection.items.sort((a, b) => {
    //   // 'a' is less specific than 'b' (= less deeply nested).
    //   if (a.getDepth() < b.getDepth()) {
    //     return 1
    //   }
    //   // 'a' is more specific than 'b' (= nested deeper).
    //   if (a.getDepth() > b.getDepth()) {
    //     return -1
    //   }
    //   // Fallback : equality leads to CSS selectors specificity comparison.
    //   // return compare(a.getSelector(), b.getSelector()) * -1
    // })
  }
}
