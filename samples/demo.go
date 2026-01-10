// Alone Theme - Go Syntax Highlighting Demo
//
// This package showcases various Go language features
// for theme preview purposes.
package demo

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"
)

// ErrNotFound is returned when a resource is not found.
var ErrNotFound = errors.New("resource not found")

// Worker represents a task worker with an ID and status.
type Worker struct {
	ID       int
	Name     string
	IsActive bool
	mu       sync.Mutex
}

// Processor defines the interface for processing items.
type Processor interface {
	Process(ctx context.Context, data []byte) error
	Status() string
}

// NewWorker creates a new Worker instance.
func NewWorker(id int, name string) *Worker {
	return &Worker{
		ID:       id,
		Name:     name,
		IsActive: true,
	}
}

// Process implements the Processor interface for Worker.
func (w *Worker) Process(ctx context.Context, data []byte) error {
	w.mu.Lock()
	defer w.mu.Unlock()

	if !w.IsActive {
		return fmt.Errorf("worker %d is inactive", w.ID)
	}

	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
		fmt.Printf("Worker %s processing %d bytes\n", w.Name, len(data))
		return nil
	}
}

// Status returns the current worker status.
func (w *Worker) Status() string {
	if w.IsActive {
		return "active"
	}
	return "inactive"
}

// RunWorkers starts multiple workers using goroutines and channels.
func RunWorkers(ctx context.Context, count int) <-chan string {
	results := make(chan string, count)

	go func() {
		defer close(results)

		var wg sync.WaitGroup
		for i := 0; i < count; i++ {
			wg.Add(1)
			go func(id int) {
				defer wg.Done()

				worker := NewWorker(id, fmt.Sprintf("worker-%d", id))
				time.Sleep(100 * time.Millisecond)

				select {
				case results <- fmt.Sprintf("Worker %d completed", id):
				case <-ctx.Done():
					return
				}
			}(i)
		}
		wg.Wait()
	}()

	return results
}

// FetchData demonstrates error handling pattern.
func FetchData(id string) ([]byte, error) {
	if id == "" {
		return nil, ErrNotFound
	}

	data := []byte(fmt.Sprintf("data for %s", id))
	return data, nil
}
