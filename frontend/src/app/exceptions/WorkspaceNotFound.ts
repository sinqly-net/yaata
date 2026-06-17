export class WorkspaceNotFound extends Error {
  constructor() {
    super();
    this.name = 'WorkspaceNotFound';
  }
}
