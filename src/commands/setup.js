import yeomanEnv from 'yeoman-environment';

export default class Command {
  exec() {
    const env = yeomanEnv.createEnv();
    env.lookup(() => {
      env.run('cmdcli');
    });
  }
}
