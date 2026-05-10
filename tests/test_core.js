var assert = require('node:assert');
var { describe, it } = require('node:test');
var core = require('../LayerRenamerCore.jsx');

var MAX_LAYER_NAME_LENGTH = core.MAX_LAYER_NAME_LENGTH;
var MAX_START_NUMBER = core.MAX_START_NUMBER;
var PREVIEW_MAX_LINES = core.PREVIEW_MAX_LINES;

describe('sanitizeBaseName', function () {
    it('should return empty string for empty input', function () {
        assert.strictEqual(core.sanitizeBaseName(''), '');
    });

    it('should return empty string for null/undefined', function () {
        assert.strictEqual(core.sanitizeBaseName(null), '');
        assert.strictEqual(core.sanitizeBaseName(undefined), '');
    });

    it('should return empty string for whitespace-only input after trim', function () {
        assert.strictEqual(core.sanitizeBaseName('   '), '');
        assert.strictEqual(core.sanitizeBaseName('\t  \t'), '');
    });

    it('should remove control characters (\\r, \\n, \\t) converting to single space', function () {
        assert.strictEqual(core.sanitizeBaseName('a\rb'), 'a b');
        assert.strictEqual(core.sanitizeBaseName('a\nb'), 'a b');
        assert.strictEqual(core.sanitizeBaseName('a\tb'), 'a b');
        assert.strictEqual(core.sanitizeBaseName('a\r\nb'), 'a b');
    });

    it('should collapse multiple spaces to single space', function () {
        assert.strictEqual(core.sanitizeBaseName('a   b'), 'a b');
        assert.strictEqual(core.sanitizeBaseName('a    b    c'), 'a b c');
    });

    it('should trim leading and trailing whitespace', function () {
        assert.strictEqual(core.sanitizeBaseName('  hello  '), 'hello');
        assert.strictEqual(core.sanitizeBaseName('\t\n hello \r\n'), 'hello');
    });

    it('should return normal input as-is', function () {
        assert.strictEqual(core.sanitizeBaseName('hello'), 'hello');
        assert.strictEqual(core.sanitizeBaseName('hello world'), 'hello world');
    });

    it('should truncate input exceeding MAX_LAYER_NAME_LENGTH to 255 chars', function () {
        var longName = 'a'.repeat(300);
        var result = core.sanitizeBaseName(longName);
        assert.strictEqual(result.length, MAX_LAYER_NAME_LENGTH);
        assert.strictEqual(result, 'a'.repeat(MAX_LAYER_NAME_LENGTH));
    });

    it('should handle mixed internal spaces and control chars', function () {
        assert.strictEqual(core.sanitizeBaseName('hello\r\n\t  world'), 'hello world');
        assert.strictEqual(core.sanitizeBaseName('\r\n  foo\tbar  \n'), 'foo bar');
    });
});

describe('isValidInput', function () {
    it('should reject empty baseName', function () {
        var result = core.isValidInput('', 0, '0');
        assert.strictEqual(result.valid, false);
        assert.strictEqual(result.error, '基础图层名称不能为空。');
    });

    it('should reject negative startNumber', function () {
        var result = core.isValidInput('layer', -1, '0');
        assert.strictEqual(result.valid, false);
        assert.ok(result.error.includes('编号起始值必须是'));
    });

    it('should reject startNumber exceeding MAX_START_NUMBER', function () {
        var result = core.isValidInput('layer', MAX_START_NUMBER + 1, '0');
        assert.strictEqual(result.valid, false);
    });

    it('should reject NaN startNumber', function () {
        var result = core.isValidInput('layer', NaN, '0');
        assert.strictEqual(result.valid, false);
    });

    it('should reject non-zero format like "abc"', function () {
        var result = core.isValidInput('layer', 0, 'abc');
        assert.strictEqual(result.valid, false);
    });

    it('should reject format with numbers like "0010"', function () {
        var result = core.isValidInput('layer', 0, '0010');
        assert.strictEqual(result.valid, false);
    });

    it('should reject format length > 10', function () {
        var result = core.isValidInput('layer', 0, '00000000000');
        assert.strictEqual(result.valid, false);
    });

    it('should reject combined baseName + format length > 255', function () {
        var longBase = 'a'.repeat(250);
        var result = core.isValidInput(longBase, 0, '000000');
        assert.strictEqual(result.valid, false);
        assert.ok(result.error.includes('名称过长'));
    });

    it('should accept valid inputs', function () {
        var result = core.isValidInput('layer', 0, '000');
        assert.strictEqual(result.valid, true);
        assert.strictEqual(result.error, '');
    });

    it('should accept boundary: startNumber=0, format="0"', function () {
        var result = core.isValidInput('layer', 0, '0');
        assert.strictEqual(result.valid, true);
    });

    it('should accept boundary: startNumber=999999, format="0000000000"', function () {
        var result = core.isValidInput('layer', 999999, '0000000000');
        assert.strictEqual(result.valid, true);
    });
});

describe('truncateName', function () {
    it('should return name within limit unchanged', function () {
        assert.strictEqual(core.truncateName('hello'), 'hello');
        assert.strictEqual(core.truncateName('a'.repeat(100)), 'a'.repeat(100));
    });

    it('should return name exactly at limit unchanged', function () {
        var name = 'a'.repeat(MAX_LAYER_NAME_LENGTH);
        assert.strictEqual(core.truncateName(name), name);
    });

    it('should truncate name exceeding 255 chars to 255', function () {
        var longName = 'a'.repeat(300);
        var result = core.truncateName(longName);
        assert.strictEqual(result.length, MAX_LAYER_NAME_LENGTH);
        assert.strictEqual(result, 'a'.repeat(MAX_LAYER_NAME_LENGTH));
    });

    it('should return empty string as-is', function () {
        assert.strictEqual(core.truncateName(''), '');
    });
});

describe('zeroPad', function () {
    it('should pad single digit to width 3', function () {
        assert.strictEqual(core.zeroPad('5', 3), '005');
    });

    it('should return value unchanged when already correct width', function () {
        assert.strictEqual(core.zeroPad('123', 3), '123');
    });

    it('should return value unchanged with width 1', function () {
        assert.strictEqual(core.zeroPad('9', 1), '9');
    });

    it('should pad with larger width', function () {
        assert.strictEqual(core.zeroPad('1', 5), '00001');
    });

    it('should pad empty string', function () {
        assert.strictEqual(core.zeroPad('', 3), '000');
    });
});

describe('isNameConflict', function () {
    var existingNames = { 'layer_01': true, 'layer_02': true };

    it('should return false when candidateName equals currentName', function () {
        assert.strictEqual(core.isNameConflict('layer_01', 'layer_01', existingNames), false);
    });

    it('should return true when conflict with existing name', function () {
        assert.strictEqual(core.isNameConflict('layer_01', 'other', existingNames), true);
    });

    it('should return false when no conflict', function () {
        assert.strictEqual(core.isNameConflict('layer_99', 'other', existingNames), false);
    });

    it('should return false when candidate not in existingNames', function () {
        assert.strictEqual(core.isNameConflict('unknown', 'current', existingNames), false);
    });

    it('should return false when name exists but equals currentName', function () {
        assert.strictEqual(core.isNameConflict('layer_01', 'layer_01', existingNames), false);
    });
});

describe('generateUniqueName', function () {
    it('should return baseName unchanged when no conflict', function () {
        var existingNames = {};
        assert.strictEqual(core.generateUniqueName('layer', existingNames), 'layer');
    });

    it('should return baseName + "_1" with single conflict', function () {
        var existingNames = { 'layer': true };
        assert.strictEqual(core.generateUniqueName('layer', existingNames), 'layer_1');
    });

    it('should return baseName + "_2" when baseName and baseName_1 exist', function () {
        var existingNames = { 'layer': true, 'layer_1': true };
        assert.strictEqual(core.generateUniqueName('layer', existingNames), 'layer_2');
    });

    it('should respect MAX_LAYER_NAME_LENGTH when truncating with suffix', function () {
        var longBase = 'a'.repeat(MAX_LAYER_NAME_LENGTH);
        var existingNames = {};
        existingNames[longBase] = true;
        var result = core.generateUniqueName(longBase, existingNames);
        assert.ok(result.length <= MAX_LAYER_NAME_LENGTH);
        assert.ok(result.endsWith('_1'));
    });

    it('should throw Error when suffix exceeds MAX_SUFFIX_ATTEMPTS', function () {
        var baseName = 'layer';
        var existingNames = {};
        existingNames[baseName] = true;

        var i;
        for (i = 1; i <= 1000; i++) {
            existingNames[baseName + '_' + i] = true;
        }

        assert.throws(
            function () {
                core.generateUniqueName(baseName, existingNames);
            },
            Error
        );
    });
});

describe('buildRenamePlan', function () {
    it('should return plan with 3 rename actions for simple no-conflict scenario', function () {
        var layers = [
            { name: 'oldA' },
            { name: 'oldB' },
            { name: 'oldC' }
        ];
        var plan = core.buildRenamePlan(layers, 'Layer_', 1, '00', core.CONFLICT_SKIP, {});
        assert.strictEqual(plan.length, 3);
        plan.forEach(function (entry) {
            assert.strictEqual(entry.action, 'rename');
        });
        assert.strictEqual(plan[0].finalName, 'Layer_01');
        assert.strictEqual(plan[1].finalName, 'Layer_02');
        assert.strictEqual(plan[2].finalName, 'Layer_03');
    });

    it('should handle skip policy with and without conflict', function () {
        var layers = [
            { name: 'A' },
            { name: 'B' }
        ];
        var existingNames = { 'Layer_01': true };
        var plan = core.buildRenamePlan(layers, 'Layer_', 1, '00', core.CONFLICT_SKIP, existingNames);

        assert.strictEqual(plan.length, 2);
        assert.strictEqual(plan[0].action, 'skip');
        assert.strictEqual(plan[0].oldName, 'A');
        assert.strictEqual(plan[0].targetName, 'Layer_01');
        assert.strictEqual(plan[1].action, 'rename');
        assert.strictEqual(plan[1].oldName, 'B');
        assert.strictEqual(plan[1].finalName, 'Layer_02');
    });

    it('should note "覆盖" for overwrite policy with conflict', function () {
        var layers = [
            { name: 'A' }
        ];
        var existingNames = { 'Layer_01': true };
        var plan = core.buildRenamePlan(layers, 'Layer_', 1, '00', core.CONFLICT_OVERWRITE, existingNames);

        assert.strictEqual(plan.length, 1);
        assert.strictEqual(plan[0].action, 'rename');
        assert.ok(plan[0].note.includes('覆盖'));
    });

    it('should apply suffix policy when conflict occurs', function () {
        var layers = [
            { name: 'A' }
        ];
        var existingNames = { 'Layer_01': true };
        var plan = core.buildRenamePlan(layers, 'Layer_', 1, '00', core.CONFLICT_SUFFIX, existingNames);

        assert.strictEqual(plan.length, 1);
        assert.strictEqual(plan[0].action, 'rename');
        assert.ok(plan[0].finalName.includes('_'));
        assert.ok(plan[0].note.includes('追加后缀'));
    });

    it('should format numbers with zero-padding correctly', function () {
        var layers = [
            { name: 'A' },
            { name: 'B' },
            { name: 'C' }
        ];
        var plan = core.buildRenamePlan(layers, 'Item_', 5, '000', core.CONFLICT_SKIP, {});
        assert.strictEqual(plan[0].targetName, 'Item_005');
        assert.strictEqual(plan[1].targetName, 'Item_006');
        assert.strictEqual(plan[2].targetName, 'Item_007');
    });

    it('should handle mixed scenario: some skip, some rename, some suffix', function () {
        var layers = [
            { name: 'A' },
            { name: 'B' },
            { name: 'C' }
        ];
        var existingNames = { 'Mix_01': true, 'Mix_02': true, 'Mix_02_1': true };

        var plan = core.buildRenamePlan(layers, 'Mix_', 1, '00', core.CONFLICT_SUFFIX, existingNames);

        assert.strictEqual(plan.length, 3);
        assert.strictEqual(plan[0].action, 'rename');
        assert.notStrictEqual(plan[0].finalName, plan[0].targetName);
        assert.strictEqual(plan[1].action, 'rename');
        assert.notStrictEqual(plan[1].finalName, plan[1].targetName);
        assert.strictEqual(plan[2].action, 'rename');
        assert.strictEqual(plan[2].finalName, plan[2].targetName);
    });

    it('should not mutate the existingNames parameter', function () {
        var existingNames = { 'existing_A': true, 'existing_B': true };
        var originalKeys = Object.keys(existingNames).sort();

        var layers = [
            { name: 'oldX' },
            { name: 'oldY' }
        ];
        core.buildRenamePlan(layers, 'Layer_', 1, '00', core.CONFLICT_SKIP, existingNames);

        var resultKeys = Object.keys(existingNames).sort();
        assert.deepStrictEqual(resultKeys, originalKeys);
        originalKeys.forEach(function (key) {
            assert.strictEqual(existingNames[key], true);
        });
    });

    it('should return empty plan for empty layers array', function () {
        var plan = core.buildRenamePlan([], 'Layer_', 1, '00', core.CONFLICT_SKIP, {});
        assert.strictEqual(plan.length, 0);
    });
});

describe('Logger', function () {
    it('should add info entry with correct format', function () {
        core.Logger.clear();
        core.Logger.info('parse', 'parsing started');
        var entries = core.Logger.getAll();
        assert.strictEqual(entries.length, 1);
        assert.strictEqual(entries[0], '[INFO] [parse] parsing started');
    });

    it('should add warn entry with [WARN] prefix', function () {
        core.Logger.clear();
        core.Logger.warn('validate', 'unusual value');
        var entries = core.Logger.getAll();
        assert.strictEqual(entries.length, 1);
        assert.ok(entries[0].startsWith('[WARN]'));
    });

    it('should add error entry with [ERROR] prefix', function () {
        core.Logger.clear();
        core.Logger.error('execute', 'something broke');
        var entries = core.Logger.getAll();
        assert.strictEqual(entries.length, 1);
        assert.ok(entries[0].startsWith('[ERROR]'));
    });

    it('should accumulate multiple entries in order', function () {
        core.Logger.clear();
        core.Logger.info('step1', 'first');
        core.Logger.warn('step2', 'second');
        core.Logger.error('step3', 'third');
        var entries = core.Logger.getAll();
        assert.strictEqual(entries.length, 3);
        assert.ok(entries[0].startsWith('[INFO]'));
        assert.ok(entries[1].startsWith('[WARN]'));
        assert.ok(entries[2].startsWith('[ERROR]'));
    });

    it('should clear all entries', function () {
        core.Logger.clear();
        core.Logger.info('s', 'msg');
        assert.strictEqual(core.Logger.getAll().length, 1);
        core.Logger.clear();
        assert.strictEqual(core.Logger.getAll().length, 0);
    });

    it('should return all entries as array', function () {
        core.Logger.clear();
        core.Logger.info('s', 'msg');
        var entries = core.Logger.getAll();
        assert.ok(Array.isArray(entries));
        assert.strictEqual(entries.length, 1);
    });

    it('should return string via toString joined by newline', function () {
        core.Logger.clear();
        core.Logger.info('s1', 'msg1');
        core.Logger.info('s2', 'msg2');
        var str = core.Logger.toString();
        assert.strictEqual(str, '[INFO] [s1] msg1\n[INFO] [s2] msg2');
    });
});

describe('formatPlanPreview', function () {
    it('should include "Dry-run 预览（未写入）" in header for dry-run mode', function () {
        var plan = [
            { oldName: 'A', targetName: 'B', finalName: 'B', action: 'rename', note: '' }
        ];
        var preview = core.formatPlanPreview(plan, true);
        assert.ok(preview.includes('Dry-run 预览（未写入）'));
    });

    it('should include "执行完成" in header for non-dry-run mode', function () {
        var plan = [
            { oldName: 'A', targetName: 'B', finalName: 'B', action: 'rename', note: '' }
        ];
        var preview = core.formatPlanPreview(plan, false);
        assert.ok(preview.includes('执行完成'));
    });

    it('should include summary with total, renamed, and skipped counts', function () {
        var plan = [
            { oldName: 'A', targetName: 'T1', finalName: 'T1', action: 'rename', note: '' },
            { oldName: 'B', targetName: 'T2', finalName: 'T2', action: 'skip', note: 'conflict' },
            { oldName: 'C', targetName: 'T3', finalName: 'T3', action: 'rename', note: '' }
        ];
        var preview = core.formatPlanPreview(plan, false);
        assert.ok(preview.includes('总计: 3'));
        assert.ok(preview.includes('重命名: 2'));
        assert.ok(preview.includes('跳过: 1'));
    });

    it('should show skip actions as "[跳过] oldName -> targetName（note）"', function () {
        var plan = [
            { oldName: 'old', targetName: 'target', finalName: 'target', action: 'skip', note: '目标名称已存在，按策略跳过' }
        ];
        var preview = core.formatPlanPreview(plan, false);
        assert.ok(preview.includes('[跳过] old -> target（目标名称已存在，按策略跳过）'));
    });

    it('should show rename actions as "[重命名] oldName -> finalName" without note', function () {
        var plan = [
            { oldName: 'old', targetName: 'target', finalName: 'target', action: 'rename', note: '' }
        ];
        var preview = core.formatPlanPreview(plan, false);
        assert.ok(preview.includes('[重命名] old -> target'));
    });

    it('should show rename actions with note when present', function () {
        var plan = [
            { oldName: 'old', targetName: 'target', finalName: 'target_1', action: 'rename', note: '冲突追加后缀' }
        ];
        var preview = core.formatPlanPreview(plan, false);
        assert.ok(preview.includes('[重命名] old -> target_1（冲突追加后缀）'));
    });

    it('should truncate when exceeding PREVIEW_MAX_LINES', function () {
        var plan = [];
        var i;
        for (i = 0; i < 60; i++) {
            plan.push({
                oldName: 'old' + i,
                targetName: 'new' + i,
                finalName: 'new' + i,
                action: 'rename',
                note: ''
            });
        }
        var preview = core.formatPlanPreview(plan, false);
        var lines = preview.split('\n');

        var omitFound = false;
        for (i = 0; i < lines.length; i++) {
            if (lines[i] === '... 其余条目已省略') {
                omitFound = true;
                break;
            }
        }
        assert.ok(omitFound, 'should contain omission marker');

        var contentLines = lines.filter(function (l) {
            return l.startsWith('[重命名]') || l.startsWith('[跳过]');
        });
        assert.ok(contentLines.length <= PREVIEW_MAX_LINES);
    });
});