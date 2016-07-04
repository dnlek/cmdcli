import 'babel-polyfill';
import { getLocalCommands } from '../src/utils';
import { getParser } from '../src/parser';
import { defineNamespace } from '../src/command';
import path from 'path';
import { expect } from 'chai';

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
    expect(Object.keys(commandsClasses)).to.have.length(1);
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
