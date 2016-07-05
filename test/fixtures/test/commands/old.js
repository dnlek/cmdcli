export default class Command {
  getArgs() {
    return [
      ['positional'],
      [['-o1', '--optional1']],
    ];
  }

  exec() {}
}
