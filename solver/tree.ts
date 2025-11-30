type MyNode<T> = Record<string, T>;
interface Node extends MyNode<Node & { word?: boolean; common?: boolean }> {}

export class RadixTree {
  head: Node;

  constructor(word_list: string[]) {
    this.head = {};
    for (const word of word_list) {
      const common = word.endsWith("+");
      const trimmed = common ? word.substring(0, word.length - 1) : word;
      this.insertWord(trimmed, common);
    }
  }

  insertWord(word: string, common = false) {
    let node = this.head;
    for (let index = 0; index < word.length; index++) {
      const letter = word[index];
      if (node[letter]) {
        if (index === word.length - 1) {
          node[letter].word = true;
          node[letter].common = common;
        } else {
          node = node[letter];
        }
      } else {
        node = node[letter] = {};
        if (index === word.length - 1) {
          // @ts-ignore
          node.word = true;
          // @ts-ignore
          node.common = common;
        }
      }
    }
  }

  startsWith(partial: string) {
    let node = this.head;
    for (let index = 0; index < partial.length; index++) {
      const letter = partial[index];
      if (node[letter]) {
        node = node[letter];
      } else {
        return false;
      }
    }
    return true;
  }

  findWord(word: string) {
    let node = this.head;
    for (let index = 0; index < word.length; index++) {
      const letter = word[index];
      if (node[letter]) {
        node = node[letter];
      } else {
        return false;
      }
    }
    if (node.word) {
      return {
        common: node.common,
      };
    }
    return false;
  }
}
