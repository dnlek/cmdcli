import inquirer from 'inquirer';

export function mapArgs(id, cfg, config) {
  let ret = {
    name: id[0],
    message: cfg.message || `Select ${cfg.help}`,
    ...(cfg.typeFunction && { filter: cfg.typeFunction }),
  };

  if ((cfg.nargs === '*' || cfg.nargs === '+') && cfg.promptChoices) {
    ret = {
      ...ret,
      type: 'checkbox',
      choices: Array.isArray(cfg.promptChoices) ?
        cfg.promptChoices : cfg.promptChoices.bind(null, config),
    };
  } if (cfg.promptRaw && cfg.promptChoices) {
    ret = {
      ...ret,
      type: 'rawList',
      choices: Array.isArray(cfg.promptChoices) ?
        cfg.promptChoices : cfg.promptChoices.bind(null, config),
    };
  } else if (cfg.promptChoices) {
    ret = {
      ...ret,
      type: 'list',
      choices: Array.isArray(cfg.promptChoices) ?
        cfg.promptChoices : cfg.promptChoices.bind(null, config),
    };
  } else if (cfg.isPassword) {
    ret = {
      ...ret,
      type: 'password',
      message: cfg.message || `Provide ${cfg.help || cfg.dest}`,
    };
  } else if (cfg.action === 'storeTrue') {
    ret = {
      ...ret,
      type: 'confirm',
      message: cfg.message || `Confirm ${cfg.help || cfg.dest}`,
    };
  } else {
    ret = {
      ...ret,
      type: 'input',
      message: cfg.message || `Provide ${cfg.help || cfg.dest}`,
    };
  }
  return ret;
}

export function argsSelector(cfg) {
  return new Promise((resolveSelector) => {
    inquirer.prompt(cfg).then((answers) => {
      resolveSelector(answers);
    });
  });
}
