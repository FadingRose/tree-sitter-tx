// tx_trace/grammar.js

module.exports = grammar({
  name: 'tx',

  // 定义在何处允许空白符，\s 匹配任何空白字符，但不包括换行符
  extras: $ => [/[ \t]/],

  rules: {
    // 1. 根规则：整个文件
    source_file: $ => seq(
      field('preamble', optional($.preamble)),
      repeat1($.trace_line),
      field('summary', optional($.summary))
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
        field('name', $.identifier),
        field('address', $.address),
        '\n'
    ),

    summary: $ => seq(
      'Transaction successfully executed.',
      '\n',
      'Gas used:',
      field('gas_used', /\d+/),
      optional('\n')
    ),

    // 3. 行的结构
    trace_line: $ => seq(
      field('prefix', optional($.prefix)),
      field('content', choice(
        $.call,
        $.return,
        $.event
      )),
      '\n'
    ),

    prefix: $ => prec.left(/[│ ]*([└├]─ )?/),

    // 4. 行内容：调用、返回、事件
    call: $ => seq(
      '[', field('gas', $.gas), ']',
      field('contract', $.contract_path),
      '::',
      field('function', $.function_name),
      optional(
        seq(
          '(',
          field('arguments', optional($.argument_list)),
          ')'
        )
      ),
      field('type', optional($.call_type))
    ),

    return: $ => seq(
      '←',
      optional(
        choice(
          seq('[', field('type', $.return_type), ']', field('values', optional($.value_list))),
          field('values', $.value_list),
          field('unknown', /<unknown>/)
        )
      )
    ),

    _raw_event_body: $ => choice(
        seq('topic', field('topic_id', /\d+/), ':', field('topic_value', $.hex_string)),
        seq('data', ':', field('data_value', $.hex_string))
    ),

    event: $ => choice(
      // 格式 1: emit Transfer(arg1, arg2)
      seq(
        'emit',
        field('name', $.identifier),
        '(',
        field('arguments', optional($.argument_list)),
        ')'
      ),
      // 格式 2: emit topic 0: ...
      prec.right(
        seq(
          'emit',
          $._raw_event_body,
          repeat(
            seq(
              '\n',
              $.prefix,
              $._raw_event_body
            )
          )
        )
      )
    ),

    // 5. 调用的组成部分
    gas: $ => /\d+/,
    contract_path: $ => choice(
        prec(2, seq(
            field('name', $.identifier),
            ':', 
            '[', field('address', $.address), ']'
        )),
        prec(1, field('name', $.identifier))
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
      field('name', $.identifier),
      '({',
      field('fields', optional($.argument_list)),
      '})'
    ),

    key_value_pair: $ => prec.right(seq(
      field('key', $.identifier),
      ':',
      field('val', $.value)
    )),

    labeled_address: $ => seq(
      field('label', $.identifier),
      ':',
      '[', field('address', $.address), ']'
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
