export class CollectionNotFound extends Error {
  constructor() {
    super();
    this.name = 'CollectionNotFound';
  }
}
