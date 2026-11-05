// 配对数据：谁吃什么 / 送动物回家（feed-match 模块使用）
import type { Text } from '@/sdk';

export interface Pair {
  id: string;
  /** 动物（目标）图标 */
  a: string;
  /** 东西（拖拽块）图标 */
  b: string;
  aName: Text;
  bName: Text;
  /** 配对成功时读的话 */
  line: Text;
}

const p = (id: string, a: string, b: string, az: string, ae: string, bz: string, be: string, lz: string, le: string): Pair => ({
  id, a, b, aName: { zh: az, en: ae }, bName: { zh: bz, en: be }, line: { zh: lz, en: le },
});

export const PAIR_SETS: Record<string, Pair[]> = {
  food: [
    p('bunny', 'items/bunny', 'items/carrot', '小兔', 'bunny', '胡萝卜', 'carrot', '小兔爱吃胡萝卜', 'The bunny eats carrots'),
    p('dog', 'items/dog', 'items/bone', '小狗', 'puppy', '骨头', 'bone', '小狗爱啃骨头', 'The puppy loves bones'),
    p('monkey', 'items/monkey', 'items/banana', '小猴', 'monkey', '香蕉', 'banana', '小猴爱吃香蕉', 'The monkey eats bananas'),
    p('panda', 'items/panda', 'items/bamboo', '熊猫', 'panda', '竹子', 'bamboo', '熊猫爱吃竹子', 'The panda eats bamboo'),
    p('mouse', 'ui/mouse', 'items/cheese', '小老鼠', 'mouse', '奶酪', 'cheese', '小老鼠爱吃奶酪', 'The mouse eats cheese'),
    p('bear', 'items/bear', 'items/honey', '小熊', 'bear', '蜂蜜', 'honey', '小熊爱吃蜂蜜', 'The bear loves honey'),
    p('cat', 'items/cat', 'items/fish', '小猫', 'kitty', '小鱼', 'fish', '小猫爱吃鱼', 'The kitty eats fish'),
    p('chick', 'items/chick', 'items/corn', '小鸡', 'chick', '玉米', 'corn', '小鸡爱吃玉米', 'The chick eats corn'),
  ],
  home: [
    p('fish', 'items/fish', '🌊', '小鱼', 'fish', '大海', 'sea', '小鱼回到大海里', 'The fish swims in the sea'),
    p('parrot', 'items/parrot', 'items/tree', '鹦鹉', 'parrot', '大树', 'tree', '鹦鹉飞回大树上', 'The parrot flies to the tree'),
    p('bee', 'items/bee', 'items/sunflower', '蜜蜂', 'bee', '花朵', 'flower', '蜜蜂飞到花朵上', 'The bee lands on the flower'),
    p('dog', 'items/dog', 'ui/house', '小狗', 'puppy', '房子', 'house', '小狗回家啦', 'The puppy goes home'),
    p('penguin', 'items/penguin', 'items/snowman', '企鹅', 'penguin', '冰雪', 'snow', '企鹅住在冰雪里', 'The penguin lives in the snow'),
    p('caterpillar', 'items/caterpillar', 'items/leaf', '毛毛虫', 'caterpillar', '树叶', 'leaf', '毛毛虫爬到树叶上', 'The caterpillar climbs on the leaf'),
    p('frog', 'items/frog', '🪷', '青蛙', 'frog', '池塘', 'pond', '青蛙跳进池塘里', 'The frog jumps into the pond'),
  ],
};
