import 'babel-polyfill';
import { getLocalCommands } from '../src/utils';
import { getParser } from '../src/parser';
import { defineNamespace } from '../src/command';
import path from 'path';
import { expect } from 'chai';

describe('Commands', () => {
  let commandsPath;
  let parser;

  beforeEach(() => {
    commandsPath = path.resolve('./test/fixtures/test');
    parser = getParser();
  });

  it('Should return local test commands classes', () => {
    const commandsClasses = getLocalCommands(['./commands'], commandsPath);
    expect(commandsClasses).to.be.a('object');
    expect(Object.keys(commandsClasses)).to.have.length(1);
    expect(commandsClasses).to.have.property('test');
    expect(commandsClasses.test).to.be.a('function');
  });

  it('Should return local test commands instances', () => {
    const commandsClasses = getLocalCommands(['./commands'], commandsPath);
    const commands = { root: defineNamespace('root', commandsClasses, parser) };
    expect(commands).to.be.a('object');
    expect(commands).to.have.property('root');
    expect(commands.root).to.be.a('object');
    expect(commands.root).not.to.have.property('isCommand');
    expect(commands.root).to.have.property('test');
    expect(commands.root.test).to.be.a('object');
    expect(commands.root.test).to.have.property('isCommand');
    expect(commands.root.test.isCommand).to.equal(true);
  });

  it('Should return local test command with alias', () => {
    const commandsClasses = getLocalCommands(['./commands'], commandsPath);
    const commands = { root: defineNamespace('root', commandsClasses, parser) };
    expect(commands.root.tst).to.be.a('object');
    expect(commands.root.tst).to.have.property('isCommand');
    expect(commands.root.tst.isCommand).to.equal(true);
  });
});
