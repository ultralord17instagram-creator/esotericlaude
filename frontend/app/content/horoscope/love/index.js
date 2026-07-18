import { suzheny } from './suzheny.js'
import { returnBranch } from './return.js'
import { block } from './block.js'

export const BRANCH_IDS = ['suzheny', 'return', 'block']
export const BRANCHES = { suzheny, return: returnBranch, block }

export const FORK = {
  title: 'Что у тебя с любовью прямо сейчас?',
  options: [
    { branch: 'suzheny', label: 'Жду своего человека', sub: 'Хочу узнать, кто он и когда' },
    { branch: 'return',  label: 'Не могу отпустить одного', sub: 'Он на уме, а что у него, непонятно' },
    { branch: 'block',   label: 'Всё время не складывается', sub: 'Хочу понять, что мешает' },
  ],
}
