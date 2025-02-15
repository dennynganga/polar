import clsx from 'clsx'
import React from 'react'

type Color = 'default' | 'muted' | 'red' | 'green'

const Banner = ({
  children,
  right,
  color,
}: {
  children: React.ReactNode
  right?: React.ReactNode
  color: Color
}) => {
  return (
    <div
      className={clsx(
        'flex items-center justify-between gap-2 rounded-lg px-3 py-2',
        color === 'default'
          ? 'bg-white shadow dark:bg-gray-800 dark:ring-1 dark:ring-gray-700'
          : '',
        color === 'muted'
          ? 'bg-gray-75 border text-gray-500 dark:border-gray-700/50  dark:bg-gray-900'
          : '',
        color === 'red'
          ? 'border bg-red-100 text-red-600  dark:border-red-800 dark:bg-red-900 dark:text-red-600'
          : '',
        color === 'green'
          ? 'border bg-green-100 text-green-600  dark:border-green-800 dark:bg-green-900 dark:text-green-600'
          : '',
      )}
    >
      <div className="flex flex-1 items-center gap-2">{children}</div>
      {right && <div>{right}</div>}
    </div>
  )
}

export default Banner
