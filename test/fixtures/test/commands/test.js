export default class Command {
  get args() {
    return [
      ['positional'],
      ['-a', '--all', {
        help: 'Display more instances informations',
      }],
      [['-b', '--backup'], {
        help: 'Backup something',
      }],
      ['-t', '--tag', {
        action: 'append',
        help: 'Filter results by tag',
        dest: 'tags',
      }],
    ];
  }

  get aliases() {
    return [
      'tst',
      ['tst2'],
      ['tst3', { all: true }],
    ];
  }
  exec() {}
}
