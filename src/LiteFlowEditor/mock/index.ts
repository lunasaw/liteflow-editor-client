import { ConditionTypeEnum, NodeTypeEnum } from '../constant';

// 测试数据节点 ID 前缀，以此开头的节点是可复用节点
// 需要预先在系统中创建这些节点
export default {
  // 串行编排(THEN)
  THEN: {
    type: ConditionTypeEnum.THEN,
    children: [
      { type: NodeTypeEnum.COMMON, id: 'example_script_a', properties: { tag: 'dog' } },
      { type: NodeTypeEnum.COMMON, id: 'example_script_b' },
      { type: NodeTypeEnum.COMMON, id: 'example_script_c' },
      { type: NodeTypeEnum.COMMON, id: 'example_script_d' },
    ],
    properties: { id: 'cat' },
  },
  // 并行编排(WHEN)
  WHEN: {
    type: ConditionTypeEnum.THEN,
    children: [
      { type: NodeTypeEnum.COMMON, id: 'example_script_a' },
      {
        type: ConditionTypeEnum.WHEN,
        children: [
          { type: NodeTypeEnum.COMMON, id: 'example_script_b' },
          { type: NodeTypeEnum.COMMON, id: 'example_script_c' },
          { type: NodeTypeEnum.COMMON, id: 'example_script_d' },
        ],
      },
      { type: NodeTypeEnum.COMMON, id: 'example_script_e' },
    ],
  },
  // 选择编排(SWITCH)
  SWITCH: {
    type: ConditionTypeEnum.SWITCH,
    condition: { type: NodeTypeEnum.SWITCH, id: 'example_switch_x' },
    children: [
      { type: NodeTypeEnum.COMMON, id: 'example_script_a' },
      { type: NodeTypeEnum.COMMON, id: 'example_script_b' },
      { type: NodeTypeEnum.COMMON, id: 'example_script_c' },
      { type: NodeTypeEnum.COMMON, id: 'example_script_d' },
    ],
  },
  // 条件编排(IF)
  IF: {
    type: ConditionTypeEnum.IF,
    condition: { type: NodeTypeEnum.BOOLEAN, id: 'example_boolean_x' },
    children: [{ type: NodeTypeEnum.COMMON, id: 'example_script_a' }],
  },
  // FOR循环
  FOR: {
    type: ConditionTypeEnum.FOR,
    condition: { type: NodeTypeEnum.FOR, id: 'example_for_x' },
    children: [
      {
        type: ConditionTypeEnum.THEN,
        children: [
          { type: NodeTypeEnum.COMMON, id: 'example_script_a' },
          { type: NodeTypeEnum.COMMON, id: 'example_script_b' },
        ],
      },
    ],
  },
  // WHILE循环
  WHILE: {
    type: ConditionTypeEnum.WHILE,
    condition: { type: NodeTypeEnum.WHILE, id: 'example_while_x' },
    children: [
      {
        type: ConditionTypeEnum.THEN,
        children: [
          { type: NodeTypeEnum.COMMON, id: 'example_script_a' },
          { type: NodeTypeEnum.COMMON, id: 'example_script_b' },
        ],
      },
    ],
  },
  // ITERATOR循环
  ITERATOR: {
    type: ConditionTypeEnum.ITERATOR,
    condition: { type: NodeTypeEnum.ITERATOR, id: 'example_iterator_x' },
    children: [
      {
        type: ConditionTypeEnum.THEN,
        children: [
          { type: NodeTypeEnum.COMMON, id: 'example_script_a' },
          { type: NodeTypeEnum.COMMON, id: 'example_script_b' },
        ],
      },
    ],
  },
  // CATCH 捕获异常
  CATCH: {
    type: ConditionTypeEnum.CATCH,
    condition: {
      type: ConditionTypeEnum.WHEN,
      children: [
        { type: NodeTypeEnum.COMMON, id: 'example_script_a' },
        { type: NodeTypeEnum.COMMON, id: 'example_script_b' },
        { type: NodeTypeEnum.COMMON, id: 'example_script_c' },
      ],
    },
    children: [
      {
        type: ConditionTypeEnum.IF,
        condition: { type: NodeTypeEnum.IF, id: 'example_if_x' },
        children: [
          { type: NodeTypeEnum.COMMON, id: 'example_script_y' },
        ],
      },
    ]
  },
  // AND_OR_NOT 与或非
  AND: {
    type: ConditionTypeEnum.IF,
    condition: {
      type: ConditionTypeEnum.AND,
      children: [
        {
          type: ConditionTypeEnum.OR,
          children: [
            { type: NodeTypeEnum.BOOLEAN, id: 'example_boolean_a' },
            { type: NodeTypeEnum.BOOLEAN, id: 'example_boolean_b' },
          ]
        },
        {
          type: ConditionTypeEnum.NOT,
          children: [
            { type: NodeTypeEnum.BOOLEAN, id: 'example_boolean_c' },
          ]
        }
      ]
    },
    children: [
      { type: NodeTypeEnum.COMMON, id: 'example_script_x' },
      { type: NodeTypeEnum.COMMON, id: 'example_script_y' },
    ],
  },
  // CHAIN 子流程
  CHAIN: {
    type: ConditionTypeEnum.THEN,
    children: [
      { type: NodeTypeEnum.COMMON, id: 'example_script_A' },
      { type: NodeTypeEnum.COMMON, id: 'example_script_B' },
      {
        type: ConditionTypeEnum.WHEN,
        children: [
          {
            type: ConditionTypeEnum.CHAIN,
            id: 'example_chain_t1',
            children: [
              {
                type: ConditionTypeEnum.THEN,
                children: [
                  { type: NodeTypeEnum.COMMON, id: 'example_script_C' },
                  {
                    type: ConditionTypeEnum.WHEN,
                    children: [
                      { type: NodeTypeEnum.COMMON, id: 'example_script_J' },
                      { type: NodeTypeEnum.COMMON, id: 'example_script_K' },
                    ]
                  },
                ]
              }
            ],
          },
          { type: NodeTypeEnum.COMMON, id: 'example_script_D' },
          {
            type: ConditionTypeEnum.CHAIN,
            id: 'example_chain_t2',
            children: [
              {
                type: ConditionTypeEnum.THEN,
                children: [
                  { type: NodeTypeEnum.COMMON, id: 'example_script_H' },
                  { type: NodeTypeEnum.COMMON, id: 'example_script_I' },
                ]
              }
            ],
          },
        ],
      },
      {
        type: ConditionTypeEnum.SWITCH,
        condition: { type: NodeTypeEnum.SWITCH, id: 'example_switch_X' },
        children: [
          { type: NodeTypeEnum.COMMON, id: 'example_script_M' },
          { type: NodeTypeEnum.COMMON, id: 'example_script_N' },
          {
            type: ConditionTypeEnum.CHAIN,
            id: 'example_chain_w1',
            children: [
              {
                type: ConditionTypeEnum.WHEN,
                children: [
                  { type: NodeTypeEnum.COMMON, id: 'example_script_Q' },
                  {
                    type: ConditionTypeEnum.THEN,
                    children: [
                      { type: NodeTypeEnum.COMMON, id: 'example_script_P' },
                      { type: NodeTypeEnum.COMMON, id: 'example_script_R' },
                    ]
                  },
                ],
                properties: {
                  id: 'w01'
                },
              },
            ],
          },
        ],
      },
    ],
  },
} as Record<string, any>;
