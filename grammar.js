// tx_trace/grammar.js

module.exports = grammar({
  name: 'tx',

  // 定义在何处允许空白符，\s 匹配任何空白字符，但不包括换行符
  extras: $ => [/[ \t]/],

  rules: {
    // 1. 根规则：整个文件
    source_file: $ => seq(
      optional($.preamble),
      repeat1($.trace_line), // 一个文件包含多行追踪信息
      optional($.summary)
    ),

    // 2. 文件元数据
    preamble: $ => seq(
      'Executing previous transactions from the block.',
      '\n',
      repeat($.compiling_line),
      'Traces:',
      '\n'
    ),
  
    compiling_line: $ => seq(
        'Compiling:',
        $.identifier,
        $.address,
        '\n'
    ),

    summary: $ => seq(
      'Transaction successfully executed.',
      '\n',
      'Gas used:',
      /\d+/,
      optional('\n')
    ),

    // 3. 行的结构
    trace_line: $ => seq(
      optional($.prefix),
      choice(
        $.call,
        $.return,
        $.event
      ),
      '\n'
    ),

    prefix: $ => prec.left(/[│ ]*([└├]─ )?/),

    // 4. 行内容：调用、返回、事件
    call: $ => seq(
      '[', $.gas, ']',
      $.contract_path,
      '::',
      $.function_name,
      optional(
        seq(
          '(',
          optional($.argument_list),
          ')'
        )
      ),
      optional($.call_type)
    ),

    return: $ => seq(
      '←',
      optional(
        choice(
          // 匹配原始格式，例如 ← [Return] 0x...
          seq('[', $.return_type, ']', optional($.value_list)),
          // 匹配直接跟着值的格式，例如 ← 0
          $.value_list,
          // 匹配特殊标记，例如 ← <unknown>
          /<unknown>/
        )
      )
    ),

    _raw_event_body: $ => choice(
      seq('topic', field('topic_id', /\d+/), ':', field('topic_value', $.hex_string)),
      seq('data', ':', field('data_value', $.hex_string))
    ),

    event: $ => choice(
      // 格式 1: 经典单行格式，例如 emit Transfer(...)
      seq(
        'emit',
        $.identifier,
        '(',
        optional($.argument_list),
        ')'
      ),
      // 格式 2: 新的多行原始日志格式
      prec.right(
              seq(
                'emit',
                $._raw_event_body, // Matches the first line, e.g., "topic 0: ..."
                // Repeatedly match subsequent topic or data lines
                repeat(
                  seq(
                    '\n', // Matches the preceding newline
                    $.prefix, // Matches the prefix of the new line (e.g., '  ' or '│ ')
                    $._raw_event_body // Matches the body of the new line
                  )
                )
              )
            )
    ),

    // 5. 调用的组成部分
    gas: $ => /\d+/,
    contract_path: $ => choice(
        // 必须优先匹配更具体的规则
        prec(2, seq($.identifier, ':', '[', $.address, ']')), 
        prec(1, $.identifier)
    ),
    function_name: $ => /[a-zA-Z0-9_]+/,
    call_type: $ => seq('[', choice('staticcall', 'delegatecall'), ']'),
    return_type: $ => choice('Return', 'Stop'),

    // 6. 参数和值列表
    argument_list: $ => seq($.value, repeat(seq(',', $.value))),
    value_list: $ => seq($.value, repeat(seq(',', $.value))),

    // 7. 通用值类型（递归核心）
    value: $ => choice(
      $.struct,
      $.key_value_pair,
      $.labeled_address,
      $.number_value,
      $.hex_string, // hex_string 需要在 address 之前，因为它更通用
      $.address,
      $.boolean,
      $.identifier
    ),

    struct: $ => seq(
      $.identifier,
      '({',
      optional($.argument_list),
      '})'
    ),

    key_value_pair: $ => prec.right(seq(
      field('key', $.identifier),
      ':',
      field('val', $.value)
    )),

    labeled_address: $ => seq(
      $.identifier,
      ':',
      '[', $.address, ']'
    ),

    number_value: $ => seq(
      optional('-'), // 1. 允许主数字为负
      /\d+/,
      optional(
        seq(
          '[',
          optional('-'), // 2. 允许科学计数法中的数字为负
          /\d+/,
          optional(seq('.', /\d+/)),
          'e',
          /\d+/,
          ']'
        )
      )
    ),
    
    boolean: $ => choice('true', 'false'),

    // 8. 基本构件
    hex_string: $ => /0x[a-fA-F0-9]+/,
    address: $ => /0x[a-fA-F0-9]{40}/,
    identifier: $ => /[a-zA-Z0-9_]+(__[A-Z_]+__)?/,
  }
});
