"""
Alone Theme - Python Syntax Highlighting Demo

This module showcases various Python language features
for theme preview purposes.
"""

from __future__ import annotations
import asyncio
from dataclasses import dataclass
from typing import Optional, List, Dict, Callable
from functools import wraps


def timing_decorator(func: Callable) -> Callable:
    """Custom decorator that logs function execution."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__}")
        result = func(*args, **kwargs)
        print(f"Completed {func.__name__}")
        return result
    return wrapper


@dataclass
class Task:
    """Represents a task with priority and status."""
    id: int
    title: str
    priority: int = 0
    completed: bool = False


class TaskManager:
    """Manages a collection of tasks with various operations."""

    MAX_TASKS: int = 100

    def __init__(self, name: str, tasks: Optional[List[Task]] = None) -> None:
        self._name = name
        self._tasks: List[Task] = tasks or []

    def __str__(self) -> str:
        return f"TaskManager({self._name!r}, {len(self._tasks)} tasks)"

    def __repr__(self) -> str:
        return f"<TaskManager name={self._name} count={len(self._tasks)}>"

    @property
    def name(self) -> str:
        """Get the manager's name."""
        return self._name

    @staticmethod
    def validate_priority(priority: int) -> bool:
        """Check if priority is within valid range."""
        return 0 <= priority <= 10

    @timing_decorator
    def add_task(self, task: Task) -> bool:
        """Add a task to the manager."""
        if len(self._tasks) >= self.MAX_TASKS:
            raise ValueError("Maximum task limit reached")
        self._tasks.append(task)
        return True

    def get_high_priority(self, threshold: int = 5) -> List[Task]:
        """Get tasks above priority threshold using list comprehension."""
        return [t for t in self._tasks if t.priority >= threshold]

    def task_summary(self) -> Dict[str, int]:
        """Create summary using dict comprehension."""
        return {
            task.title: task.priority
            for task in self._tasks
            if not task.completed
        }


async def fetch_tasks(manager: TaskManager, delay: float = 0.5) -> List[Task]:
    """
    Async function to simulate fetching tasks.

    Args:
        manager: The task manager instance
        delay: Simulated network delay in seconds

    Returns:
        List of tasks from the manager
    """
    try:
        await asyncio.sleep(delay)
        tasks = manager.get_high_priority()
        print(f"Fetched {len(tasks)} high-priority tasks")
        return tasks
    except Exception as e:
        print(f"Error fetching tasks: {e}")
        raise


if __name__ == "__main__":
    manager = TaskManager("Development")
    manager.add_task(Task(1, "Fix critical bug", priority=9))
    manager.add_task(Task(2, "Update documentation", priority=3))

    # f-string formatting
    print(f"Manager: {manager.name}, Summary: {manager.task_summary()}")
