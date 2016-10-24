/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import * as assert from 'assert';
import { decodeTextMateToken, decodeTextMateTokens, DecodeMap, TMScopeRegistry } from 'vs/editor/node/textMate/TMSyntax';
import { TMState } from 'vs/editor/common/modes/TMState';

suite('TextMate.TMScopeRegistry', () => {

	test('getFilePath', () => {
		let manager = new TMScopeRegistry();

		manager.register('a', 'source.a', './grammar/a.tmLanguage');
		assert.equal(manager.getFilePath('source.a'), './grammar/a.tmLanguage');
		assert.equal(manager.getFilePath('a'), null);
		assert.equal(manager.getFilePath('source.b'), null);
		assert.equal(manager.getFilePath('b'), null);

		manager.register('b', 'source.b', './grammar/b.tmLanguage');
		assert.equal(manager.getFilePath('source.a'), './grammar/a.tmLanguage');
		assert.equal(manager.getFilePath('a'), null);
		assert.equal(manager.getFilePath('source.b'), './grammar/b.tmLanguage');
		assert.equal(manager.getFilePath('b'), null);

		manager.register('a', 'source.a', './grammar/ax.tmLanguage');
		assert.equal(manager.getFilePath('source.a'), './grammar/ax.tmLanguage');
		assert.equal(manager.getFilePath('a'), null);
		assert.equal(manager.getFilePath('source.b'), './grammar/b.tmLanguage');
		assert.equal(manager.getFilePath('b'), null);
	});

	test('scopeToLanguage', () => {
		let manager = new TMScopeRegistry();

		assert.equal(manager.scopeToLanguage('source.html'), null);

		manager.register('html', 'source.html', null);
		manager.register('c', 'source.c', null);
		manager.register('css', 'source.css', null);
		manager.register('javascript', 'source.js', null);
		manager.register('python', 'source.python', null);
		manager.register('smarty', 'source.smarty', null);
		manager.register(null, 'source.baz', null);

		// exact matches
		assert.equal(manager.scopeToLanguage('source.html'), 'html');
		assert.equal(manager.scopeToLanguage('source.css'), 'css');
		assert.equal(manager.scopeToLanguage('source.c'), 'c');
		assert.equal(manager.scopeToLanguage('source.js'), 'javascript');
		assert.equal(manager.scopeToLanguage('source.python'), 'python');
		assert.equal(manager.scopeToLanguage('source.smarty'), 'smarty');

		// prefix matches
		assert.equal(manager.scopeToLanguage('source.css.embedded.html'), 'css');
		assert.equal(manager.scopeToLanguage('source.js.embedded.html'), 'javascript');
		assert.equal(manager.scopeToLanguage('source.python.embedded.html'), 'python');
		assert.equal(manager.scopeToLanguage('source.smarty.embedded.html'), 'smarty');

		// misses
		assert.equal(manager.scopeToLanguage('source.ts'), null);
		assert.equal(manager.scopeToLanguage('source.csss'), null);
		assert.equal(manager.scopeToLanguage('source.baz'), null);
		assert.equal(manager.scopeToLanguage('asource.css'), null);
		assert.equal(manager.scopeToLanguage('a.source.css'), null);
		assert.equal(manager.scopeToLanguage('source_css'), null);
		assert.equal(manager.scopeToLanguage('punctuation.definition.tag.html'), null);
	});

});

suite('TextMate.decodeTextMateTokens', () => {

	test('html and embedded modes', () => {

		var tests = [
			{
				line: '<!DOCTYPE HTML>',
				tmTokens: [
					{ startIndex: 0, endIndex: 2, scopes: ['text.html.basic', 'meta.tag.sgml.html', 'punctuation.definition.tag.html'] },
					{ startIndex: 2, endIndex: 9, scopes: ['text.html.basic', 'meta.tag.sgml.html', 'meta.tag.sgml.doctype.html'] },
					{ startIndex: 9, endIndex: 14, scopes: ['text.html.basic', 'meta.tag.sgml.html', 'meta.tag.sgml.doctype.html'] },
					{ startIndex: 14, endIndex: 15, scopes: ['text.html.basic', 'meta.tag.sgml.html', 'punctuation.definition.tag.html'] }
				],
				tokens: [
					{ startIndex: 0, type: 'meta.tag.sgml.html.punctuation.definition' },
					{ startIndex: 2, type: 'meta.tag.sgml.html.doctype' },
					{ startIndex: 14, type: 'meta.tag.sgml.html.punctuation.definition' },
				],
				modeTransitions: [{ startIndex: 0, modeId: 'html' }]
			}, {
				line: '<!-- ',
				tmTokens: [
					{ startIndex: 0, endIndex: 4, scopes: ['text.html.basic', 'comment.block.html', 'punctuation.definition.comment.html'] },
					{ startIndex: 4, endIndex: 6, scopes: ['text.html.basic', 'comment.block.html'] }
				],
				tokens: [
					{ startIndex: 0, type: 'html.punctuation.definition.comment.block' },
					{ startIndex: 4, type: 'html.comment.block' },
				],
				modeTransitions: [{ startIndex: 0, modeId: 'html' }]
			}, {
				line: '\tComments are overrated',
				tmTokens: [
					{ startIndex: 0, endIndex: 24, scopes: ['text.html.basic', 'comment.block.html'] }
				],
				tokens: [
					{ startIndex: 0, type: 'html.comment.block' },
				],
				modeTransitions: [{ startIndex: 0, modeId: 'html' }]
			}, {
				line: '-->',
				tmTokens: [
					{ startIndex: 0, endIndex: 3, scopes: ['text.html.basic', 'comment.block.html', 'punctuation.definition.comment.html'] }
				],
				tokens: [
					{ startIndex: 0, type: 'html.punctuation.definition.comment.block' },
				],
				modeTransitions: [{ startIndex: 0, modeId: 'html' }]
			}, {
				line: '<html>',
				tmTokens: [
					{ startIndex: 0, endIndex: 1, scopes: ['text.html.basic', 'meta.tag.structure.any.html', 'punctuation.definition.tag.html'] },
					{ startIndex: 1, endIndex: 5, scopes: ['text.html.basic', 'meta.tag.structure.any.html', 'entity.name.tag.structure.any.html'] },
					{ startIndex: 5, endIndex: 6, scopes: ['text.html.basic', 'meta.tag.structure.any.html', 'punctuation.definition.tag.html'] }
				],
				tokens: [
					{ startIndex: 0, type: 'meta.tag.html.punctuation.definition.structure.any' },
					{ startIndex: 1, type: 'meta.tag.html.structure.any.entity.name' },
					{ startIndex: 5, type: 'meta.tag.html.punctuation.definition.structure.any' },
				],
				modeTransitions: [{ startIndex: 0, modeId: 'html' }]
			}, {
				line: '<head>',
				tmTokens: [
					{ startIndex: 0, endIndex: 1, scopes: ['text.html.basic', 'meta.tag.structure.any.html', 'punctuation.definition.tag.html'] },
					{ startIndex: 1, endIndex: 5, scopes: ['text.html.basic', 'meta.tag.structure.any.html', 'entity.name.tag.structure.any.html'] },
					{ startIndex: 5, endIndex: 6, scopes: ['text.html.basic', 'meta.tag.structure.any.html', 'punctuation.definition.tag.html'] }
				],
				tokens: [
					{ startIndex: 0, type: 'meta.tag.html.punctuation.definition.structure.any' },
					{ startIndex: 1, type: 'meta.tag.html.structure.any.entity.name' },
					{ startIndex: 5, type: 'meta.tag.html.punctuation.definition.structure.any' },
				],
				modeTransitions: [{ startIndex: 0, modeId: 'html' }]
			}, {
				line: '\t<title>HTML Sample</title>',
				tmTokens: [
					{ startIndex: 0, endIndex: 1, scopes: ['text.html.basic'] },
					{ startIndex: 1, endIndex: 2, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'punctuation.definition.tag.begin.html'] },
					{ startIndex: 2, endIndex: 7, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'entity.name.tag.inline.any.html'] },
					{ startIndex: 7, endIndex: 8, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'punctuation.definition.tag.end.html'] },
					{ startIndex: 8, endIndex: 19, scopes: ['text.html.basic'] },
					{ startIndex: 19, endIndex: 21, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'punctuation.definition.tag.begin.html'] },
					{ startIndex: 21, endIndex: 26, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'entity.name.tag.inline.any.html'] },
					{ startIndex: 26, endIndex: 27, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'punctuation.definition.tag.end.html'] }
				],
				tokens: [
					{ startIndex: 0, type: '' },
					{ startIndex: 1, type: 'meta.tag.html.punctuation.definition.any.inline.begin' },
					{ startIndex: 2, type: 'meta.tag.html.any.entity.name.inline' },
					{ startIndex: 7, type: 'meta.tag.html.punctuation.definition.any.inline.end' },
					{ startIndex: 8, type: '' },
					{ startIndex: 19, type: 'meta.tag.html.punctuation.definition.any.inline.begin' },
					{ startIndex: 21, type: 'meta.tag.html.any.entity.name.inline' },
					{ startIndex: 26, type: 'meta.tag.html.punctuation.definition.any.inline.end' },
				],
				modeTransitions: [{ startIndex: 0, modeId: 'html' }]
			}, {
				line: '\t<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">',
				tmTokens: [
					{ startIndex: 0, endIndex: 1, scopes: ['text.html.basic'] },
					{ startIndex: 1, endIndex: 2, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'punctuation.definition.tag.begin.html'] },
					{ startIndex: 2, endIndex: 6, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'entity.name.tag.inline.any.html'] },
					{ startIndex: 6, endIndex: 7, scopes: ['text.html.basic', 'meta.tag.inline.any.html'] },
					{ startIndex: 7, endIndex: 17, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'entity.other.attribute-name.html'] },
					{ startIndex: 17, endIndex: 18, scopes: ['text.html.basic', 'meta.tag.inline.any.html'] },
					{ startIndex: 18, endIndex: 19, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html'] },
					{ startIndex: 19, endIndex: 34, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'string.quoted.double.html'] },
					{ startIndex: 34, endIndex: 35, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html'] },
					{ startIndex: 35, endIndex: 36, scopes: ['text.html.basic', 'meta.tag.inline.any.html'] },
					{ startIndex: 36, endIndex: 43, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'entity.other.attribute-name.html'] },
					{ startIndex: 43, endIndex: 44, scopes: ['text.html.basic', 'meta.tag.inline.any.html'] },
					{ startIndex: 44, endIndex: 45, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html'] },
					{ startIndex: 45, endIndex: 52, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'string.quoted.double.html'] },
					{ startIndex: 52, endIndex: 53, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html'] },
					{ startIndex: 53, endIndex: 54, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'punctuation.definition.tag.end.html'] }
				],
				tokens: [
					{ startIndex: 0, type: '' },
					{ startIndex: 1, type: 'meta.tag.html.punctuation.definition.any.inline.begin' },
					{ startIndex: 2, type: 'meta.tag.html.any.entity.name.inline' },
					{ startIndex: 6, type: 'meta.tag.html.any.inline' },
					{ startIndex: 7, type: 'meta.tag.html.any.entity.inline.other.attribute-name' },
					{ startIndex: 17, type: 'meta.tag.html.any.inline' },
					{ startIndex: 18, type: 'meta.tag.html.punctuation.definition.any.inline.begin.string.quoted.double' },
					{ startIndex: 19, type: 'meta.tag.html.any.inline.string.quoted.double' },
					{ startIndex: 34, type: 'meta.tag.html.punctuation.definition.any.inline.end.string.quoted.double' },
					{ startIndex: 35, type: 'meta.tag.html.any.inline' },
					{ startIndex: 36, type: 'meta.tag.html.any.entity.inline.other.attribute-name' },
					{ startIndex: 43, type: 'meta.tag.html.any.inline' },
					{ startIndex: 44, type: 'meta.tag.html.punctuation.definition.any.inline.begin.string.quoted.double' },
					{ startIndex: 45, type: 'meta.tag.html.any.inline.string.quoted.double' },
					{ startIndex: 52, type: 'meta.tag.html.punctuation.definition.any.inline.end.string.quoted.double' },
					{ startIndex: 53, type: 'meta.tag.html.punctuation.definition.any.inline.end' },
				],
				modeTransitions: [{ startIndex: 0, modeId: 'html' }]
			}, {
				line: '\t<style type=\"text/css\">',
				tmTokens: [
					{ startIndex: 0, endIndex: 1, scopes: ['text.html.basic', 'source.css.embedded.html'] },
					{ startIndex: 1, endIndex: 2, scopes: ['text.html.basic', 'source.css.embedded.html', 'punctuation.definition.tag.html'] },
					{ startIndex: 2, endIndex: 7, scopes: ['text.html.basic', 'source.css.embedded.html', 'entity.name.tag.style.html'] },
					{ startIndex: 7, endIndex: 8, scopes: ['text.html.basic', 'source.css.embedded.html'] },
					{ startIndex: 8, endIndex: 12, scopes: ['text.html.basic', 'source.css.embedded.html', 'entity.other.attribute-name.html'] },
					{ startIndex: 12, endIndex: 13, scopes: ['text.html.basic', 'source.css.embedded.html'] },
					{ startIndex: 13, endIndex: 14, scopes: ['text.html.basic', 'source.css.embedded.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html'] },
					{ startIndex: 14, endIndex: 22, scopes: ['text.html.basic', 'source.css.embedded.html', 'string.quoted.double.html'] },
					{ startIndex: 22, endIndex: 23, scopes: ['text.html.basic', 'source.css.embedded.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html'] },
					{ startIndex: 23, endIndex: 24, scopes: ['text.html.basic', 'source.css.embedded.html', 'punctuation.definition.tag.html'] }
				],
				tokens: [
					{ startIndex: 0, type: 'html.source.css.embedded' },
					{ startIndex: 1, type: 'tag.html.punctuation.definition.source.css.embedded' },
					{ startIndex: 2, type: 'tag.html.entity.name.source.css.embedded.style' },
					{ startIndex: 7, type: 'html.source.css.embedded' },
					{ startIndex: 8, type: 'html.entity.other.attribute-name.source.css.embedded' },
					{ startIndex: 12, type: 'html.source.css.embedded' },
					{ startIndex: 13, type: 'html.punctuation.definition.begin.string.quoted.double.source.css.embedded' },
					{ startIndex: 14, type: 'html.string.quoted.double.source.css.embedded' },
					{ startIndex: 22, type: 'html.punctuation.definition.end.string.quoted.double.source.css.embedded' },
					{ startIndex: 23, type: 'tag.html.punctuation.definition.source.css.embedded' },
				],
				modeTransitions: [{ startIndex: 0, modeId: 'html' }]
			}, {
				line: '\t\th1 {',
				tmTokens: [
					{ startIndex: 0, endIndex: 2, scopes: ['text.html.basic', 'source.css.embedded.html', 'meta.selector.css'] },
					{ startIndex: 2, endIndex: 4, scopes: ['text.html.basic', 'source.css.embedded.html', 'meta.selector.css', 'entity.name.tag.css'] },
					{ startIndex: 4, endIndex: 5, scopes: ['text.html.basic', 'source.css.embedded.html', 'meta.selector.css'] },
					{ startIndex: 5, endIndex: 6, scopes: ['text.html.basic', 'source.css.embedded.html', 'meta.property-list.css', 'punctuation.section.property-list.begin.css'] }
				],
				tokens: [
					{ startIndex: 0, type: 'meta.html.source.css.embedded.selector' },
					{ startIndex: 2, type: 'meta.tag.html.entity.name.source.css.embedded.selector' },
					{ startIndex: 4, type: 'meta.html.source.css.embedded.selector' },
					{ startIndex: 5, type: 'meta.html.punctuation.begin.source.css.embedded.property-list.section' },
				],
				modeTransitions: [{ startIndex: 0, modeId: 'html' }]
			}, {
				line: '\t\t\tcolor: #CCA3A3;',
				tmTokens: [
					{ startIndex: 0, endIndex: 3, scopes: ['text.html.basic', 'source.css.embedded.html', 'meta.property-list.css'] },
					{ startIndex: 3, endIndex: 8, scopes: ['text.html.basic', 'source.css.embedded.html', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css'] },
					{ startIndex: 8, endIndex: 9, scopes: ['text.html.basic', 'source.css.embedded.html', 'meta.property-list.css', 'meta.property-value.css', 'punctuation.separator.key-value.css'] },
					{ startIndex: 9, endIndex: 10, scopes: ['text.html.basic', 'source.css.embedded.html', 'meta.property-list.css', 'meta.property-value.css'] },
					{ startIndex: 10, endIndex: 11, scopes: ['text.html.basic', 'source.css.embedded.html', 'meta.property-list.css', 'meta.property-value.css', 'constant.other.color.rgb-value.css', 'punctuation.definition.constant.css'] },
					{ startIndex: 11, endIndex: 17, scopes: ['text.html.basic', 'source.css.embedded.html', 'meta.property-list.css', 'meta.property-value.css', 'constant.other.color.rgb-value.css'] },
					{ startIndex: 17, endIndex: 18, scopes: ['text.html.basic', 'source.css.embedded.html', 'meta.property-list.css', 'meta.property-value.css', 'punctuation.terminator.rule.css'] }
				],
				tokens: [
					{ startIndex: 0, type: 'meta.html.source.css.embedded.property-list' },
					{ startIndex: 3, type: 'meta.html.source.css.embedded.property-list.property-name.support.type' },
					{ startIndex: 8, type: 'meta.html.punctuation.source.css.embedded.property-list.property-value.separator.key-value' },
					{ startIndex: 9, type: 'meta.html.source.css.embedded.property-list.property-value' },
					{ startIndex: 10, type: 'meta.html.punctuation.definition.other.source.css.embedded.property-list.property-value.constant.color.rgb-value' },
					{ startIndex: 11, type: 'meta.html.other.source.css.embedded.property-list.property-value.constant.color.rgb-value' },
					{ startIndex: 17, type: 'meta.html.punctuation.source.css.embedded.property-list.property-value.terminator.rule' },
				],
				modeTransitions: [{ startIndex: 0, modeId: 'html' }]
			}, {
				line: '\t\t}',
				tmTokens: [
					{ startIndex: 0, endIndex: 2, scopes: ['text.html.basic', 'source.css.embedded.html', 'meta.property-list.css'] },
					{ startIndex: 2, endIndex: 3, scopes: ['text.html.basic', 'source.css.embedded.html', 'meta.property-list.css', 'punctuation.section.property-list.end.css'] }
				],
				tokens: [
					{ startIndex: 0, type: 'meta.html.source.css.embedded.property-list' },
					{ startIndex: 2, type: 'meta.html.punctuation.end.source.css.embedded.property-list.section' },
				],
				modeTransitions: [{ startIndex: 0, modeId: 'html' }]
			}, {
				line: '\t</style>',
				tmTokens: [
					{ startIndex: 0, endIndex: 1, scopes: ['text.html.basic', 'source.css.embedded.html'] },
					{ startIndex: 1, endIndex: 3, scopes: ['text.html.basic', 'source.css.embedded.html', 'punctuation.definition.tag.html'] },
					{ startIndex: 3, endIndex: 8, scopes: ['text.html.basic', 'source.css.embedded.html', 'entity.name.tag.style.html'] },
					{ startIndex: 8, endIndex: 9, scopes: ['text.html.basic', 'source.css.embedded.html', 'punctuation.definition.tag.html'] }
				],
				tokens: [
					{ startIndex: 0, type: 'html.source.css.embedded' },
					{ startIndex: 1, type: 'tag.html.punctuation.definition.source.css.embedded' },
					{ startIndex: 3, type: 'tag.html.entity.name.source.css.embedded.style' },
					{ startIndex: 8, type: 'tag.html.punctuation.definition.source.css.embedded' },
				],
				modeTransitions: [{ startIndex: 0, modeId: 'html' }]
			}, {
				line: '\t<script type=\"text/javascript\">',
				tmTokens: [
					{ startIndex: 0, endIndex: 1, scopes: ['text.html.basic', 'source.js.embedded.html'] },
					{ startIndex: 1, endIndex: 2, scopes: ['text.html.basic', 'source.js.embedded.html', 'punctuation.definition.tag.html'] },
					{ startIndex: 2, endIndex: 8, scopes: ['text.html.basic', 'source.js.embedded.html', 'entity.name.tag.script.html'] },
					{ startIndex: 8, endIndex: 9, scopes: ['text.html.basic', 'source.js.embedded.html'] },
					{ startIndex: 9, endIndex: 13, scopes: ['text.html.basic', 'source.js.embedded.html', 'entity.other.attribute-name.html'] },
					{ startIndex: 13, endIndex: 14, scopes: ['text.html.basic', 'source.js.embedded.html'] },
					{ startIndex: 14, endIndex: 15, scopes: ['text.html.basic', 'source.js.embedded.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html'] },
					{ startIndex: 15, endIndex: 30, scopes: ['text.html.basic', 'source.js.embedded.html', 'string.quoted.double.html'] },
					{ startIndex: 30, endIndex: 31, scopes: ['text.html.basic', 'source.js.embedded.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html'] },
					{ startIndex: 31, endIndex: 32, scopes: ['text.html.basic', 'source.js.embedded.html', 'punctuation.definition.tag.html'] }
				],
				tokens: [
					{ startIndex: 0, type: 'html.source.embedded.js' },
					{ startIndex: 1, type: 'tag.html.punctuation.definition.source.embedded.js' },
					{ startIndex: 2, type: 'tag.html.entity.name.source.embedded.js.script' },
					{ startIndex: 8, type: 'html.source.embedded.js' },
					{ startIndex: 9, type: 'html.entity.other.attribute-name.source.embedded.js' },
					{ startIndex: 13, type: 'html.source.embedded.js' },
					{ startIndex: 14, type: 'html.punctuation.definition.begin.string.quoted.double.source.embedded.js' },
					{ startIndex: 15, type: 'html.string.quoted.double.source.embedded.js' },
					{ startIndex: 30, type: 'html.punctuation.definition.end.string.quoted.double.source.embedded.js' },
					{ startIndex: 31, type: 'tag.html.punctuation.definition.source.embedded.js' },
				],
				modeTransitions: [{ startIndex: 0, modeId: 'html' }]
			}, {
				line: '\t\twindow.alert(\"I am a sample...\");',
				tmTokens: [
					{ startIndex: 0, endIndex: 2, scopes: ['text.html.basic', 'source.js.embedded.html'] },
					{ startIndex: 2, endIndex: 8, scopes: ['text.html.basic', 'source.js.embedded.html', 'support.variable.dom.js'] },
					{ startIndex: 8, endIndex: 9, scopes: ['text.html.basic', 'source.js.embedded.html', 'punctuation.accessor.js'] },
					{ startIndex: 9, endIndex: 14, scopes: ['text.html.basic', 'source.js.embedded.html', 'support.function.js'] },
					{ startIndex: 14, endIndex: 15, scopes: ['text.html.basic', 'source.js.embedded.html', 'meta.brace.round.js'] },
					{ startIndex: 15, endIndex: 16, scopes: ['text.html.basic', 'source.js.embedded.html', 'string.quoted.double.js', 'punctuation.definition.string.begin.js'] },
					{ startIndex: 16, endIndex: 32, scopes: ['text.html.basic', 'source.js.embedded.html', 'string.quoted.double.js'] },
					{ startIndex: 32, endIndex: 33, scopes: ['text.html.basic', 'source.js.embedded.html', 'string.quoted.double.js', 'punctuation.definition.string.end.js'] },
					{ startIndex: 33, endIndex: 34, scopes: ['text.html.basic', 'source.js.embedded.html', 'meta.brace.round.js'] },
					{ startIndex: 34, endIndex: 35, scopes: ['text.html.basic', 'source.js.embedded.html', 'punctuation.terminator.statement.js'] }
				],
				tokens: [
					{ startIndex: 0, type: 'html.source.embedded.js' },
					{ startIndex: 2, type: 'html.source.embedded.support.js.variable.dom' },
					{ startIndex: 8, type: 'html.punctuation.source.embedded.js.accessor' },
					{ startIndex: 9, type: 'html.source.embedded.support.js.function' },
					{ startIndex: 14, type: 'meta.html.source.embedded.js.brace.round' },
					{ startIndex: 15, type: 'html.punctuation.definition.begin.string.quoted.double.source.embedded.js' },
					{ startIndex: 16, type: 'html.string.quoted.double.source.embedded.js' },
					{ startIndex: 32, type: 'html.punctuation.definition.end.string.quoted.double.source.embedded.js' },
					{ startIndex: 33, type: 'meta.html.source.embedded.js.brace.round' },
					{ startIndex: 34, type: 'html.punctuation.source.embedded.terminator.js.statement' },
				],
				modeTransitions: [{ startIndex: 0, modeId: 'html' }]
			}, {
				line: '\t</script>',
				tmTokens: [
					{ startIndex: 0, endIndex: 1, scopes: ['text.html.basic', 'source.js.embedded.html'] },
					{ startIndex: 1, endIndex: 3, scopes: ['text.html.basic', 'source.js.embedded.html', 'punctuation.definition.tag.html'] },
					{ startIndex: 3, endIndex: 9, scopes: ['text.html.basic', 'source.js.embedded.html', 'entity.name.tag.script.html'] },
					{ startIndex: 9, endIndex: 10, scopes: ['text.html.basic', 'source.js.embedded.html', 'punctuation.definition.tag.html'] }
				],
				tokens: [
					{ startIndex: 0, type: 'html.source.embedded.js' },
					{ startIndex: 1, type: 'tag.html.punctuation.definition.source.embedded.js' },
					{ startIndex: 3, type: 'tag.html.entity.name.source.embedded.js.script' },
					{ startIndex: 9, type: 'tag.html.punctuation.definition.source.embedded.js' },
				],
				modeTransitions: [{ startIndex: 0, modeId: 'html' }]
			}, {
				line: '</head>',
				tmTokens: [
					{ startIndex: 0, endIndex: 2, scopes: ['text.html.basic', 'meta.tag.structure.any.html', 'punctuation.definition.tag.html'] },
					{ startIndex: 2, endIndex: 6, scopes: ['text.html.basic', 'meta.tag.structure.any.html', 'entity.name.tag.structure.any.html'] },
					{ startIndex: 6, endIndex: 7, scopes: ['text.html.basic', 'meta.tag.structure.any.html', 'punctuation.definition.tag.html'] }
				],
				tokens: [
					{ startIndex: 0, type: 'meta.tag.html.punctuation.definition.structure.any' },
					{ startIndex: 2, type: 'meta.tag.html.structure.any.entity.name' },
					{ startIndex: 6, type: 'meta.tag.html.punctuation.definition.structure.any' },
				],
				modeTransitions: [{ startIndex: 0, modeId: 'html' }]
			}, {
				line: '<body>',
				tmTokens: [
					{ startIndex: 0, endIndex: 1, scopes: ['text.html.basic', 'meta.tag.structure.any.html', 'punctuation.definition.tag.html'] },
					{ startIndex: 1, endIndex: 5, scopes: ['text.html.basic', 'meta.tag.structure.any.html', 'entity.name.tag.structure.any.html'] },
					{ startIndex: 5, endIndex: 6, scopes: ['text.html.basic', 'meta.tag.structure.any.html', 'punctuation.definition.tag.html'] }
				],
				tokens: [
					{ startIndex: 0, type: 'meta.tag.html.punctuation.definition.structure.any' },
					{ startIndex: 1, type: 'meta.tag.html.structure.any.entity.name' },
					{ startIndex: 5, type: 'meta.tag.html.punctuation.definition.structure.any' },
				],
				modeTransitions: [{ startIndex: 0, modeId: 'html' }]
			}, {
				line: '\t<h1>Heading No.1</h1>',
				tmTokens: [
					{ startIndex: 0, endIndex: 1, scopes: ['text.html.basic'] },
					{ startIndex: 1, endIndex: 2, scopes: ['text.html.basic', 'meta.tag.block.any.html', 'punctuation.definition.tag.begin.html'] },
					{ startIndex: 2, endIndex: 4, scopes: ['text.html.basic', 'meta.tag.block.any.html', 'entity.name.tag.block.any.html'] },
					{ startIndex: 4, endIndex: 5, scopes: ['text.html.basic', 'meta.tag.block.any.html', 'punctuation.definition.tag.end.html'] },
					{ startIndex: 5, endIndex: 17, scopes: ['text.html.basic'] },
					{ startIndex: 17, endIndex: 19, scopes: ['text.html.basic', 'meta.tag.block.any.html', 'punctuation.definition.tag.begin.html'] },
					{ startIndex: 19, endIndex: 21, scopes: ['text.html.basic', 'meta.tag.block.any.html', 'entity.name.tag.block.any.html'] },
					{ startIndex: 21, endIndex: 22, scopes: ['text.html.basic', 'meta.tag.block.any.html', 'punctuation.definition.tag.end.html'] }
				],
				tokens: [
					{ startIndex: 0, type: '' },
					{ startIndex: 1, type: 'meta.tag.html.punctuation.definition.block.any.begin' },
					{ startIndex: 2, type: 'meta.tag.html.block.any.entity.name' },
					{ startIndex: 4, type: 'meta.tag.html.punctuation.definition.block.any.end' },
					{ startIndex: 5, type: '' },
					{ startIndex: 17, type: 'meta.tag.html.punctuation.definition.block.any.begin' },
					{ startIndex: 19, type: 'meta.tag.html.block.any.entity.name' },
					{ startIndex: 21, type: 'meta.tag.html.punctuation.definition.block.any.end' },
				],
				modeTransitions: [{ startIndex: 0, modeId: 'html' }]
			}, {
				line: '\t<input disabled type=\"button\" value=\"Click me\" />',
				tmTokens: [
					{ startIndex: 0, endIndex: 1, scopes: ['text.html.basic'] },
					{ startIndex: 1, endIndex: 2, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'punctuation.definition.tag.begin.html'] },
					{ startIndex: 2, endIndex: 7, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'entity.name.tag.inline.any.html'] },
					{ startIndex: 7, endIndex: 8, scopes: ['text.html.basic', 'meta.tag.inline.any.html'] },
					{ startIndex: 8, endIndex: 16, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'entity.other.attribute-name.html'] },
					{ startIndex: 16, endIndex: 17, scopes: ['text.html.basic', 'meta.tag.inline.any.html'] },
					{ startIndex: 17, endIndex: 21, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'entity.other.attribute-name.html'] },
					{ startIndex: 21, endIndex: 22, scopes: ['text.html.basic', 'meta.tag.inline.any.html'] },
					{ startIndex: 22, endIndex: 23, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html'] },
					{ startIndex: 23, endIndex: 29, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'string.quoted.double.html'] },
					{ startIndex: 29, endIndex: 30, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html'] },
					{ startIndex: 30, endIndex: 31, scopes: ['text.html.basic', 'meta.tag.inline.any.html'] },
					{ startIndex: 31, endIndex: 36, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'entity.other.attribute-name.html'] },
					{ startIndex: 36, endIndex: 37, scopes: ['text.html.basic', 'meta.tag.inline.any.html'] },
					{ startIndex: 37, endIndex: 38, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html'] },
					{ startIndex: 38, endIndex: 46, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'string.quoted.double.html'] },
					{ startIndex: 46, endIndex: 47, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html'] },
					{ startIndex: 47, endIndex: 50, scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'punctuation.definition.tag.end.html'] }
				],
				tokens: [
					{ startIndex: 0, type: '' },
					{ startIndex: 1, type: 'meta.tag.html.punctuation.definition.any.inline.begin' },
					{ startIndex: 2, type: 'meta.tag.html.any.entity.name.inline' },
					{ startIndex: 7, type: 'meta.tag.html.any.inline' },
					{ startIndex: 8, type: 'meta.tag.html.any.entity.inline.other.attribute-name' },
					{ startIndex: 16, type: 'meta.tag.html.any.inline' },
					{ startIndex: 17, type: 'meta.tag.html.any.entity.inline.other.attribute-name' },
					{ startIndex: 21, type: 'meta.tag.html.any.inline' },
					{ startIndex: 22, type: 'meta.tag.html.punctuation.definition.any.inline.begin.string.quoted.double' },
					{ startIndex: 23, type: 'meta.tag.html.any.inline.string.quoted.double' },
					{ startIndex: 29, type: 'meta.tag.html.punctuation.definition.any.inline.end.string.quoted.double' },
					{ startIndex: 30, type: 'meta.tag.html.any.inline' },
					{ startIndex: 31, type: 'meta.tag.html.any.entity.inline.other.attribute-name' },
					{ startIndex: 36, type: 'meta.tag.html.any.inline' },
					{ startIndex: 37, type: 'meta.tag.html.punctuation.definition.any.inline.begin.string.quoted.double' },
					{ startIndex: 38, type: 'meta.tag.html.any.inline.string.quoted.double' },
					{ startIndex: 46, type: 'meta.tag.html.punctuation.definition.any.inline.end.string.quoted.double' },
					{ startIndex: 47, type: 'meta.tag.html.punctuation.definition.any.inline.end' },
				],
				modeTransitions: [{ startIndex: 0, modeId: 'html' }]
			}, {
				line: '</body>',
				tmTokens: [
					{ startIndex: 0, endIndex: 2, scopes: ['text.html.basic', 'meta.tag.structure.any.html', 'punctuation.definition.tag.html'] },
					{ startIndex: 2, endIndex: 6, scopes: ['text.html.basic', 'meta.tag.structure.any.html', 'entity.name.tag.structure.any.html'] },
					{ startIndex: 6, endIndex: 7, scopes: ['text.html.basic', 'meta.tag.structure.any.html', 'punctuation.definition.tag.html'] }
				],
				tokens: [
					{ startIndex: 0, type: 'meta.tag.html.punctuation.definition.structure.any' },
					{ startIndex: 2, type: 'meta.tag.html.structure.any.entity.name' },
					{ startIndex: 6, type: 'meta.tag.html.punctuation.definition.structure.any' },
				],
				modeTransitions: [{ startIndex: 0, modeId: 'html' }]
			}, {
				line: '</html>',
				tmTokens: [
					{ startIndex: 0, endIndex: 2, scopes: ['text.html.basic', 'meta.tag.structure.any.html', 'punctuation.definition.tag.html'] },
					{ startIndex: 2, endIndex: 6, scopes: ['text.html.basic', 'meta.tag.structure.any.html', 'entity.name.tag.structure.any.html'] },
					{ startIndex: 6, endIndex: 7, scopes: ['text.html.basic', 'meta.tag.structure.any.html', 'punctuation.definition.tag.html'] }
				],
				tokens: [
					{ startIndex: 0, type: 'meta.tag.html.punctuation.definition.structure.any' },
					{ startIndex: 2, type: 'meta.tag.html.structure.any.entity.name' },
					{ startIndex: 6, type: 'meta.tag.html.punctuation.definition.structure.any' },
				],
				modeTransitions: [{ startIndex: 0, modeId: 'html' }]
			}
		];

		let decodeMap = new DecodeMap(new TMScopeRegistry());

		let state = new TMState('html', null, null);

		for (let i = 0, len = tests.length; i < len; i++) {
			let test = tests[i];
			let actual = decodeTextMateTokens(test.line, 0, decodeMap, test.tmTokens, state);

			let actualTokens = actual.tokens.map((t) => { return { startIndex: t.startIndex, type: t.type}; });
			let actualModeTransitions = actual.modeTransitions.map((t) => { return { startIndex: t.startIndex, modeId: t.modeId }; });

			assert.deepEqual(actualTokens, test.tokens, 'test ' + test.line);
			assert.deepEqual(actualModeTransitions, test.modeTransitions, 'test ' + test.line);
		}
	});
});

suite('textMate', () => {

	function assertRelaxedEqual(a: string, b: string): void {
		let relaxString = (str: string) => {
			let pieces = str.split('.');
			pieces.sort();
			return pieces.join('.');
		};
		assert.equal(relaxString(a), relaxString(b));
	}

	function slowDecodeTextMateToken(scopes: string[]): string {
		let allTokensMap: { [token: string]: boolean; } = Object.create(null);
		for (let i = 1; i < scopes.length; i++) {
			let pieces = scopes[i].split('.');
			for (let j = 0; j < pieces.length; j++) {
				allTokensMap[pieces[j]] = true;
			}
		}
		return Object.keys(allTokensMap).join('.');
	}

	function testOneDecodeTextMateToken(decodeMap: DecodeMap, scopes: string[], expected: string): void {
		let actual = decodeTextMateToken(decodeMap, scopes);
		assert.equal(actual, expected);

		// Sanity-check
		let alternativeExpected = slowDecodeTextMateToken(scopes);
		assertRelaxedEqual(actual, alternativeExpected);
	}

	function testDecodeTextMateToken(input: string[][], expected: string[]): void {
		let decodeMap = new DecodeMap(new TMScopeRegistry());

		for (let i = 0; i < input.length; i++) {
			testOneDecodeTextMateToken(decodeMap, input[i], expected[i]);
		}
	}

	test('decodeTextMateToken JSON regression', () => {
		let input = [
			['source.json', 'meta.structure.dictionary.json'],
			['source.json', 'meta.structure.dictionary.json', 'support.type.property-name.json', 'punctuation.support.type.property-name.begin.json'],
			['source.json', 'meta.structure.dictionary.json', 'support.type.property-name.json'],
			['source.json', 'meta.structure.dictionary.json', 'support.type.property-name.json', 'punctuation.support.type.property-name.end.json'],
			['source.json', 'meta.structure.dictionary.json', 'meta.structure.dictionary.value.json', 'punctuation.separator.dictionary.key-value.json'],
			['source.json', 'meta.structure.dictionary.json', 'meta.structure.dictionary.value.json'],
			['source.json', 'meta.structure.dictionary.json', 'meta.structure.dictionary.value.json', 'string.quoted.double.json', 'punctuation.definition.string.begin.json'],
			['source.json', 'meta.structure.dictionary.json', 'meta.structure.dictionary.value.json', 'string.quoted.double.json', 'punctuation.definition.string.end.json'],
			['source.json', 'meta.structure.dictionary.json', 'meta.structure.dictionary.value.json', 'punctuation.separator.dictionary.pair.json']
		];

		let expected = [
			'meta.structure.dictionary.json',
			'meta.structure.dictionary.json.support.type.property-name.punctuation.begin',
			'meta.structure.dictionary.json.support.type.property-name',
			'meta.structure.dictionary.json.support.type.property-name.punctuation.end',
			'meta.structure.dictionary.json.punctuation.value.separator.key-value',
			'meta.structure.dictionary.json.value',
			'meta.structure.dictionary.json.punctuation.begin.value.string.quoted.double.definition',
			'meta.structure.dictionary.json.punctuation.end.value.string.quoted.double.definition',
			'meta.structure.dictionary.json.punctuation.value.separator.pair'
		];

		testDecodeTextMateToken(input, expected);
	});

	test('decodeTextMateToken', () => {
		let input = getTestScopes();

		let expected = [
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.entity.name',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.parameter.brace.round',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.parameter',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.name.parameter.variable',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.parameter',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.name.parameter.variable',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.parameter',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.name.parameter.variable',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.parameter.brace.round',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.entity.name.overload',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.parameter.brace.round',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.name.parameter.variable',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.parameter.brace.round',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.brace.curly',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.keyword.operator.comparison',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.string.double',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.string.double',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.string.double',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.keyword.operator.arithmetic',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.keyword.operator.arithmetic',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.string.double',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.string.double',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.string.double',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.brace.array.literal.square',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.array.literal',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.brace.array.literal.square',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.keyword.operator.comparison',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.brace.curly',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.brace.curly',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.name',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member.name',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member',
			'meta.function.js.decl.block.type.parameters.paren.cover.object.method.declaration.field.member'
		];

		testDecodeTextMateToken(input, expected);
	});
});

function getTestScopes(): string[][] {
	return [
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'entity.name.function.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.function.type.parameter.js', 'meta.brace.round.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.function.type.parameter.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.function.type.parameter.js', 'parameter.name.js', 'variable.parameter.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.function.type.parameter.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.function.type.parameter.js', 'parameter.name.js', 'variable.parameter.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.function.type.parameter.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.function.type.parameter.js', 'parameter.name.js', 'variable.parameter.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.function.type.parameter.js', 'meta.brace.round.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.method.overload.declaration.js', 'entity.name.function.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.function.type.parameter.js', 'meta.brace.round.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.function.type.parameter.js', 'parameter.name.js', 'variable.parameter.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.function.type.parameter.js', 'meta.brace.round.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.brace.curly.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'keyword.operator.comparison.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'string.double.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'string.double.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'string.double.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'keyword.operator.arithmetic.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'keyword.operator.arithmetic.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'string.double.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'string.double.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'string.double.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.array.literal.js', 'meta.brace.square.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.array.literal.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.array.literal.js', 'meta.brace.square.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'keyword.operator.comparison.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.brace.curly.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.brace.curly.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.name.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.name.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js'],
		['source.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js', 'meta.object.type.js', 'meta.field.declaration.js', 'meta.block.js', 'meta.object.member.js', 'meta.function.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.object.type.js', 'meta.method.declaration.js', 'meta.decl.block.js', 'meta.type.parameters.js', 'meta.type.paren.cover.js']
	];
}
