import 'babel-polyfill';
import { getLocalCommands } from '../src/utils';
import { getParser } from '../src/parser';
import { defineNamespace, getCurrentCommand, resolve } from '../src/command';
import path from 'path';
import { expect } from 'chai';

function resolveCommand(cmdArgs, parser, commands) {
  const args = parser.parseArgs(cmdArgs);
  const command = getCurrentCommand(commands, args);
  return resolve(command, {}, args, parser);
}

describe('Commands', () => {
  let commandsPath;
  let commandsClasses;
  let parser;
  let commands;

  beforeEach(() => {
    parser = getParser();
    commandsPath = path.resolve('./test/fixtures/test');
    commandsClasses = getLocalCommands(['./commands'], commandsPath);
    commands = { root: defineNamespace('root', commandsClasses, parser) };
  });

  it('Should return local test commands classes', () => {
    expect(commandsClasses).to.be.a('object');
    expect(Object.keys(commandsClasses)).to.have.length(2);
    expect(commandsClasses).to.have.property('test');
    expect(commandsClasses.test).to.be.a('function');
  });

  it('Should return local test commands instances', () => {
    expect(commands).to.be.a('object');
    expect(commands).to.have.property('root');
    expect(commands.root).to.be.a('object');
    expect(commands.root).not.to.have.property('isCommand');
    expect(commands.root).to.have.property('test');
    expect(commands.root.test).to.be.a('object');
    expect(commands.root.test).to.have.property('cmd');
    expect(commands.root.test.cmd).to.have.property('isCommand');
    expect(commands.root.test.cmd.isCommand).to.equal(true);
    expect(commands.root.test.args).to.be.a('undefined');
  });

  describe('Old parameters function', () => {
    it('Should return positional argument for getArgs function', () => {
      return resolveCommand(['old', 'POSITIONAL_VALUE'], parser, commands)
        .then((cmdObj) => {
          expect(cmdObj.args.positional).to.equal('POSITIONAL_VALUE');
        });
    })
    it('Should return optional argument for getArgs function', () => {
      return resolveCommand(['old', '-o1', 'POSITIONAL_VALUE'], parser, commands)
        .then((cmdObj) => {
          expect(cmdObj.args.optional1).to.equal(true);
        });
    })
  });

  describe('Parameters', () => {

    describe('Positional arguments', () => {
      it('Should store positional value - simple form', () => {
        return resolveCommand(['test', 'POSITIONAL1_VALUE', '_'], parser, commands)
          .then((cmdObj) => {
            expect(cmdObj.args.positional1).to.equal('POSITIONAL1_VALUE');
          });
      });

      it('Should store positional value - full form', () => {
        return resolveCommand(['test', '_', 'POSITIONAL2_VALUE'], parser, commands)
          .then((cmdObj) => {
            expect(cmdObj.args.positional2).to.equal('POSITIONAL2_VALUE');
          });
      });
    });

    describe('Optional arguments', () => {
      it('Should store true for optional argument in nested form - short', () => {
        return resolveCommand(['test', '-o1', '_', '_'], parser, commands)
          .then((cmdObj) => {
            expect(cmdObj.args.optional1).to.equal(true);
          });
      });

      it('Should store true for optional argument in nested form - long', () => {
        return resolveCommand(['test', '--optional1', '_', '_'], parser, commands)
          .then((cmdObj) => {
            expect(cmdObj.args.optional1).to.equal(true);
          });
      });

      it('Should store true for optional argument - short only', () => {
        return resolveCommand(['test', '-o3', '_', '_'], parser, commands)
          .then((cmdObj) => {
            expect(cmdObj.args.o3).to.equal(true);
          });
      });

      it('Should store true for optional argument - short', () => {
        return resolveCommand(['test', '-o4', '_', '_'], parser, commands)
          .then((cmdObj) => {
            expect(cmdObj.args.optional4).to.equal(true);
          });
      });

      it('Should store true for optional argument - long', () => {
        return resolveCommand(['test', '--optional4', '_', '_'], parser, commands)
          .then((cmdObj) => {
            expect(cmdObj.args.optional4).to.equal(true);
          });
      });

      it('Should store true for optional argument in custom destination', () => {
        return resolveCommand(['test', '--optional5', '_', '_'], parser, commands)
          .then((cmdObj) => {
            expect(cmdObj.args.optional_5).to.equal(true);
          });
      });

      it('Should store value for optional argument', () => {
        return resolveCommand(['test', '--optional6', 'OPTIONAL6_VALUE', '_', '_'], parser, commands)
          .then((cmdObj) => {
            expect(cmdObj.args.optional6).to.equal('OPTIONAL6_VALUE');
          });
      });

    });
  });

  describe('Aliases', () => {
    it('Should return local tst alias', () => {
      expect(commands.root).to.have.property('tst');
      expect(commands.root.tst).to.be.a('object');
      expect(commands.root.tst).to.have.property('cmd');
      expect(commands.root.tst.cmd).to.have.property('isCommand');
      expect(commands.root.tst.cmd.isCommand).to.equal(true);
      expect(commands.root.tst.cmd).to.equal(commands.root.test.cmd);
      expect(commands.root.tst.args).to.be.a('undefined');
    });

    it('Should return local tst2 alias', () => {
      expect(commands.root).to.have.property('tst2');
      expect(commands.root.tst2).to.be.a('object');
      expect(commands.root.tst2).to.have.property('cmd');
      expect(commands.root.tst2.cmd).to.have.property('isCommand');
      expect(commands.root.tst2.cmd.isCommand).to.equal(true);
      expect(commands.root.tst2.cmd).to.equal(commands.root.test.cmd);
      expect(commands.root.tst2.args).to.be.a('undefined');
    });

    it('Should return local tst3 alias', () => {
      expect(commands.root).to.have.property('tst3');
      expect(commands.root.tst3).to.be.a('object');
      expect(commands.root.tst3).to.have.property('cmd');
      expect(commands.root.tst3.cmd).to.have.property('isCommand');
      expect(commands.root.tst3.cmd.isCommand).to.equal(true);
      expect(commands.root.tst3.cmd).to.equal(commands.root.test.cmd);
      expect(commands.root.tst3.args).to.be.a('object');
    });
  })

});
