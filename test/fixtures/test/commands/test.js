export default class Command {
  get args() {
    return [
      ['positional1'],
      ['positional2', {
        action: 'store',
        help: 'POSITIONAL2_HELP_TEXT',
      }],
      [['-o1', '--optional1']],
      [['-o2']],
      ['-o3'],
      ['-o4', '--optional4'],
      ['-o5', '--optional5', {
        dest: 'optional_5',
      }],
      ['-o6', '--optional6', {
        action: 'store',
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
